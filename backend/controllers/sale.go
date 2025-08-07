package controllers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"pdv-backend/config"
	"pdv-backend/models"
)

// GetSales retorna todas as vendas
func GetSales(c *gin.Context) {
	var sales []models.Sale
	query := config.DB.Preload("User").Preload("SaleItems.Product.Category")

	// Filtros opcionais
	if userID := c.Query("user_id"); userID != "" {
		query = query.Where("user_id = ?", userID)
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if paymentType := c.Query("payment_type"); paymentType != "" {
		query = query.Where("payment_type = ?", paymentType)
	}

	// Filtro por data
	if startDate := c.Query("start_date"); startDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", parsedDate)
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", endDate); err == nil {
			// Adicionar 23:59:59 para incluir todo o dia
			endOfDay := parsedDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			query = query.Where("created_at <= ?", endOfDay)
		}
	}

	// Ordenação
	query = query.Order("created_at DESC")

	// Paginação
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	offset := (page - 1) * limit

	if err := query.Offset(offset).Limit(limit).Find(&sales).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar vendas"})
		return
	}

	// Converter para response
	responses := make([]models.SaleResponse, len(sales))
	for i, sale := range sales {
		responses[i] = sale.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetSale retorna uma venda específica
func GetSale(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var sale models.Sale
	if err := config.DB.Preload("User").Preload("SaleItems.Product.Category").First(&sale, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Venda não encontrada"})
		return
	}

	c.JSON(http.StatusOK, sale.ToResponse())
}

// CreateSale cria uma nova venda
func CreateSale(c *gin.Context) {
	var req models.SaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Obter ID do usuário do contexto
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não autenticado"})
		return
	}

	// Iniciar transação
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Validar produtos e calcular total
	var total float64
	var saleItems []models.SaleItem

	for _, itemReq := range req.Items {
		var product models.Product
		if err := tx.First(&product, itemReq.ProductID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Produto não encontrado: " + strconv.Itoa(int(itemReq.ProductID))})
			return
		}

		if !product.Active {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Produto inativo: " + product.Name})
			return
		}

		if product.Stock < itemReq.Quantity {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Estoque insuficiente para: " + product.Name})
			return
		}

		// Calcular total do item
		itemTotal := product.Price * float64(itemReq.Quantity)
		total += itemTotal

		// Criar item da venda
		saleItem := models.SaleItem{
			ProductID: itemReq.ProductID,
			Quantity:  itemReq.Quantity,
			UnitPrice: product.Price,
			Total:     itemTotal,
		}
		saleItems = append(saleItems, saleItem)

		// Atualizar estoque
		product.Stock -= itemReq.Quantity
		if err := tx.Save(&product).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar estoque"})
			return
		}
	}

	// Criar venda
	sale := models.Sale{
		Total:       total,
		Discount:    0,
		Tax:         0,
		PaymentType: req.PaymentMethod,
		UserID:      userID.(uint),
		Status:      "completed",
	}

	// Processar desconto por porcentagem
	if req.DiscountPercentage != nil {
		sale.Discount = (total * (*req.DiscountPercentage)) / 100
	} else if req.Discount != nil {
		sale.Discount = *req.Discount
	}
	
	if req.Tax != nil {
		sale.Tax = *req.Tax
	}

	// Calcular total final
	sale.CalculateTotal()

	// Processar valor recebido e troco (apenas para dinheiro)
	if req.PaymentMethod == "dinheiro" && req.AmountReceived != nil {
		amountReceived := *req.AmountReceived
		if amountReceived < sale.FinalTotal {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Valor recebido insuficiente"})
			return
		}
		sale.AmountReceived = &amountReceived
		change := amountReceived - sale.FinalTotal
		sale.Change = &change
	}

	if err := tx.Create(&sale).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar venda"})
		return
	}

	// Criar itens da venda
	for i := range saleItems {
		saleItems[i].SaleID = sale.ID
		if err := tx.Create(&saleItems[i]).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar itens da venda"})
			return
		}
	}

	// Confirmar transação
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao finalizar venda"})
		return
	}

	// Carregar venda completa para resposta
	config.DB.Preload("User").Preload("SaleItems.Product.Category").First(&sale, sale.ID)

	c.JSON(http.StatusCreated, sale.ToResponse())
}

// CancelSale cancela uma venda
func CancelSale(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	// Iniciar transação
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Buscar venda
	var sale models.Sale
	if err := tx.Preload("SaleItems").First(&sale, uint(id)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Venda não encontrada"})
		return
	}

	if sale.Status == "cancelled" {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Venda já está cancelada"})
		return
	}

	// Restaurar estoque dos produtos
	for _, item := range sale.SaleItems {
		var product models.Product
		if err := tx.First(&product, item.ProductID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar produto"})
			return
		}

		product.Stock += item.Quantity
		if err := tx.Save(&product).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao restaurar estoque"})
			return
		}
	}

	// Atualizar status da venda
	sale.Status = "cancelled"
	if err := tx.Save(&sale).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao cancelar venda"})
		return
	}

	// Confirmar transação
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao finalizar cancelamento"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Venda cancelada com sucesso"})
}

// GetSalesReport retorna relatório de vendas
func GetSalesReport(c *gin.Context) {
	type SalesReport struct {
		TotalSales     int64   `json:"total_sales"`
		TotalRevenue   float64 `json:"total_revenue"`
		AverageTicket  float64 `json:"average_ticket"`
		CancelledSales int64   `json:"cancelled_sales"`
	}

	var report SalesReport

	// Filtros de data
	query := config.DB.Model(&models.Sale{})
	if startDate := c.Query("start_date"); startDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", startDate); err == nil {
			query = query.Where("created_at >= ?", parsedDate)
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", endDate); err == nil {
			endOfDay := parsedDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
			query = query.Where("created_at <= ?", endOfDay)
		}
	}

	// Total de vendas completadas
	query.Where("status = ?", "completed").Count(&report.TotalSales)

	// Receita total
	query.Where("status = ?", "completed").Select("COALESCE(SUM(final_total), 0)").Scan(&report.TotalRevenue)

	// Ticket médio
	if report.TotalSales > 0 {
		report.AverageTicket = report.TotalRevenue / float64(report.TotalSales)
	}

	// Vendas canceladas
	query.Where("status = ?", "cancelled").Count(&report.CancelledSales)

	c.JSON(http.StatusOK, report)
}