package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"pdv-backend/config"
	"pdv-backend/models"
)

// DashboardStats representa as estatísticas do dashboard
type DashboardStats struct {
	TotalProducts    int64   `json:"total_products"`
	ActiveProducts   int64   `json:"active_products"`
	LowStockProducts int64   `json:"low_stock_products"`
	TotalCategories  int64   `json:"total_categories"`
	TotalUsers       int64   `json:"total_users"`
	TodaySales       int64   `json:"today_sales"`
	TodayRevenue     float64 `json:"today_revenue"`
	MonthSales       int64   `json:"month_sales"`
	MonthRevenue     float64 `json:"month_revenue"`
	YearSales        int64   `json:"year_sales"`
	YearRevenue      float64 `json:"year_revenue"`
}

// TopProduct representa um produto mais vendido
type TopProduct struct {
	ProductID    uint    `json:"product_id"`
	ProductName  string  `json:"product_name"`
	TotalSold    int64   `json:"total_sold"`
	TotalRevenue float64 `json:"total_revenue"`
}

// GetDashboardStats retorna estatísticas gerais do sistema
func GetDashboardStats(c *gin.Context) {
	var stats DashboardStats

	// Estatísticas de produtos
	config.DB.Model(&models.Product{}).Count(&stats.TotalProducts)
	config.DB.Model(&models.Product{}).Where("active = ?", true).Count(&stats.ActiveProducts)
	config.DB.Model(&models.Product{}).Where("stock <= min_stock AND active = ?", true).Count(&stats.LowStockProducts)

	// Estatísticas de categorias
	config.DB.Model(&models.Category{}).Where("active = ?", true).Count(&stats.TotalCategories)

	// Estatísticas de usuários
	config.DB.Model(&models.User{}).Where("active = ?", true).Count(&stats.TotalUsers)

	// Data de hoje
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24*time.Hour - time.Nanosecond)

	// Vendas de hoje
	config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfDay, endOfDay).Count(&stats.TodaySales)
	config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfDay, endOfDay).Select("COALESCE(SUM(final_total), 0)").Scan(&stats.TodayRevenue)

	// Vendas do mês
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)
	config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfMonth, endOfMonth).Count(&stats.MonthSales)
	config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfMonth, endOfMonth).Select("COALESCE(SUM(final_total), 0)").Scan(&stats.MonthRevenue)

	// Vendas do ano
	startOfYear := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	endOfYear := startOfYear.AddDate(1, 0, 0).Add(-time.Nanosecond)
	config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfYear, endOfYear).Count(&stats.YearSales)
	config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfYear, endOfYear).Select("COALESCE(SUM(final_total), 0)").Scan(&stats.YearRevenue)

	c.JSON(http.StatusOK, stats)
}

// GetLowStockProducts retorna produtos com estoque baixo
func GetLowStockProducts(c *gin.Context) {
	var products []models.Product

	if err := config.DB.Preload("Category").Where("stock <= min_stock AND active = ?", true).Order("stock ASC").Find(&products).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar produtos com estoque baixo"})
		return
	}

	// Converter para response
	responses := make([]models.ProductResponse, len(products))
	for i, product := range products {
		responses[i] = product.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetTopProducts retorna os produtos mais vendidos
func GetTopProducts(c *gin.Context) {
	limit := c.DefaultQuery("limit", "10")
	period := c.DefaultQuery("period", "month") // day, week, month, year

	// Definir período
	now := time.Now()
	var startDate time.Time

	switch period {
	case "day":
		startDate = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	case "week":
		weekday := int(now.Weekday())
		if weekday == 0 {
			weekday = 7 // Domingo = 7
		}
		startDate = now.AddDate(0, 0, -weekday+1)
		startDate = time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
	case "year":
		startDate = time.Date(now.Year(), 1, 1, 0, 0, 0, 0, now.Location())
	default: // month
		startDate = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	}

	var topProducts []TopProduct

	query := `
		SELECT 
			si.product_id,
			p.name as product_name,
			SUM(si.quantity) as total_sold,
			SUM(si.total) as total_revenue
		FROM sale_items si
		JOIN sales s ON si.sale_id = s.id
		JOIN products p ON si.product_id = p.id
		WHERE s.status = 'completed' AND s.created_at >= ?
		GROUP BY si.product_id, p.name
		ORDER BY total_sold DESC
		LIMIT ?
	`

	if err := config.DB.Raw(query, startDate, limit).Scan(&topProducts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar produtos mais vendidos"})
		return
	}

	c.JSON(http.StatusOK, topProducts)
}

// GetSalesChart retorna dados para gráfico de vendas
func GetSalesChart(c *gin.Context) {
	period := c.DefaultQuery("period", "week") // week, month, year

	type ChartData struct {
		Date   string  `json:"date"`
		Sales  int64   `json:"sales"`
		Revenue float64 `json:"revenue"`
	}

	var chartData []ChartData
	now := time.Now()

	switch period {
	case "week":
		// Últimos 7 dias
		for i := 6; i >= 0; i-- {
			date := now.AddDate(0, 0, -i)
			startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
			endOfDay := startOfDay.Add(24*time.Hour - time.Nanosecond)

			var sales int64
			var revenue float64
			config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfDay, endOfDay).Count(&sales)
			config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfDay, endOfDay).Select("COALESCE(SUM(final_total), 0)").Scan(&revenue)

			chartData = append(chartData, ChartData{
				Date:    date.Format("02/01"),
				Sales:   sales,
				Revenue: revenue,
			})
		}
	case "month":
		// Últimas 4 semanas
		for i := 3; i >= 0; i-- {
			startDate := now.AddDate(0, 0, -i*7)
			endDate := startDate.AddDate(0, 0, 6)
			startOfWeek := time.Date(startDate.Year(), startDate.Month(), startDate.Day(), 0, 0, 0, 0, startDate.Location())
			endOfWeek := time.Date(endDate.Year(), endDate.Month(), endDate.Day(), 23, 59, 59, 999999999, endDate.Location())

			var sales int64
			var revenue float64
			config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfWeek, endOfWeek).Count(&sales)
			config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfWeek, endOfWeek).Select("COALESCE(SUM(final_total), 0)").Scan(&revenue)

			chartData = append(chartData, ChartData{
				Date:    startDate.Format("02/01") + "-" + endDate.Format("02/01"),
				Sales:   sales,
				Revenue: revenue,
			})
		}
	case "year":
		// Últimos 12 meses
		for i := 11; i >= 0; i-- {
			date := now.AddDate(0, -i, 0)
			startOfMonth := time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, date.Location())
			endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

			var sales int64
			var revenue float64
			config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfMonth, endOfMonth).Count(&sales)
			config.DB.Model(&models.Sale{}).Where("status = ? AND created_at BETWEEN ? AND ?", "completed", startOfMonth, endOfMonth).Select("COALESCE(SUM(final_total), 0)").Scan(&revenue)

			chartData = append(chartData, ChartData{
				Date:    date.Format("01/2006"),
				Sales:   sales,
				Revenue: revenue,
			})
		}
	}

	c.JSON(http.StatusOK, chartData)
}