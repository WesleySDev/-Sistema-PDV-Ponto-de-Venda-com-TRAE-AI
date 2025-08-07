package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"pdv-backend/config"
	"pdv-backend/models"
)

// GetProducts retorna todos os produtos
func GetProducts(c *gin.Context) {
	var products []models.Product
	query := config.DB.Preload("Category")

	// Filtros opcionais
	if categoryID := c.Query("category_id"); categoryID != "" {
		query = query.Where("category_id = ?", categoryID)
	}

	if active := c.Query("active"); active != "" {
		query = query.Where("active = ?", active)
	}

	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR barcode LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if lowStock := c.Query("low_stock"); lowStock == "true" {
		query = query.Where("stock <= min_stock")
	}

	if err := query.Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar produtos"})
		return
	}

	// Converter para response
	responses := make([]models.ProductResponse, len(products))
	for i, product := range products {
		responses[i] = product.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetProduct retorna um produto específico
func GetProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var product models.Product
	if err := config.DB.Preload("Category").First(&product, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
		return
	}

	c.JSON(http.StatusOK, product.ToResponse())
}

// GetProductByBarcode retorna um produto pelo código de barras
func GetProductByBarcode(c *gin.Context) {
	barcode := c.Param("barcode")
	if barcode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Código de barras requerido"})
		return
	}

	var product models.Product
	if err := config.DB.Preload("Category").Where("barcode = ? AND active = ?", barcode, true).First(&product).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
		return
	}

	c.JSON(http.StatusOK, product.ToResponse())
}

// CreateProduct cria um novo produto
func CreateProduct(c *gin.Context) {
	var req models.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se a categoria existe
	var category models.Category
	if err := config.DB.First(&category, *req.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Categoria não encontrada"})
		return
	}

	// Verificar se o código de barras já existe (se fornecido)
	if req.Barcode != "" {
		var existingProduct models.Product
		if err := config.DB.Where("barcode = ?", req.Barcode).First(&existingProduct).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Código de barras já existe"})
			return
		}
	}

	// Criar produto
	product := models.Product{
		Name:        req.Name,
		Barcode:     req.Barcode,
		Description: req.Description,
		Price:       *req.Price,
		CategoryID:  *req.CategoryID,
		Unit:        req.Unit,
	}

	if req.CostPrice != nil {
		product.CostPrice = *req.CostPrice
	}
	if req.Stock != nil {
		product.Stock = *req.Stock
	}
	if req.MinStock != nil {
		product.MinStock = *req.MinStock
	}
	if req.Active != nil {
		product.Active = *req.Active
	}

	if err := config.DB.Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar produto"})
		return
	}

	// Carregar categoria para resposta
	config.DB.Preload("Category").First(&product, product.ID)

	c.JSON(http.StatusCreated, product.ToResponse())
}

// UpdateProduct atualiza um produto
func UpdateProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req models.ProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar produto
	var product models.Product
	if err := config.DB.First(&product, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
		return
	}

	// Verificar se a categoria existe
	var category models.Category
	if err := config.DB.First(&category, *req.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Categoria não encontrada"})
		return
	}

	// Verificar se o código de barras já existe em outro produto
	if req.Barcode != "" && req.Barcode != product.Barcode {
		var existingProduct models.Product
		if err := config.DB.Where("barcode = ? AND id != ?", req.Barcode, product.ID).First(&existingProduct).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Código de barras já existe"})
			return
		}
	}

	// Atualizar campos
	product.Name = req.Name
	product.Barcode = req.Barcode
	product.Description = req.Description
	product.Price = *req.Price
	product.CategoryID = *req.CategoryID
	product.Unit = req.Unit

	if req.CostPrice != nil {
		product.CostPrice = *req.CostPrice
	}
	if req.Stock != nil {
		product.Stock = *req.Stock
	}
	if req.MinStock != nil {
		product.MinStock = *req.MinStock
	}
	if req.Active != nil {
		product.Active = *req.Active
	}

	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar produto"})
		return
	}

	// Carregar categoria para resposta
	config.DB.Preload("Category").First(&product, product.ID)

	c.JSON(http.StatusOK, product.ToResponse())
}

// DeleteProduct exclui um produto
func DeleteProduct(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var product models.Product
	if err := config.DB.First(&product, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
		return
	}

	// Verificar se o produto tem vendas associadas
	var saleItemCount int64
	config.DB.Model(&models.SaleItem{}).Where("product_id = ?", product.ID).Count(&saleItemCount)
	if saleItemCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível excluir produto com vendas associadas"})
		return
	}

	if err := config.DB.Delete(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao excluir produto"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Produto excluído com sucesso"})
}

// UpdateStock atualiza o estoque de um produto
func UpdateStock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	type UpdateStockRequest struct {
		Quantity int    `json:"quantity" binding:"required"`
		Type     string `json:"type" binding:"required,oneof=add subtract set"`
	}

	var req UpdateStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var product models.Product
	if err := config.DB.First(&product, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Produto não encontrado"})
		return
	}

	// Atualizar estoque baseado no tipo
	switch req.Type {
	case "add":
		product.Stock += req.Quantity
	case "subtract":
		product.Stock -= req.Quantity
		if product.Stock < 0 {
			product.Stock = 0
		}
	case "set":
		product.Stock = req.Quantity
	}

	if err := config.DB.Save(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar estoque"})
		return
	}

	// Carregar categoria para resposta
	config.DB.Preload("Category").First(&product, product.ID)

	c.JSON(http.StatusOK, product.ToResponse())
}