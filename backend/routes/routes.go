package routes

import (
	"github.com/gin-gonic/gin"
	"pdv-backend/controllers"
	"pdv-backend/middleware"
	"gorm.io/gorm"
)

// SetupRoutes configura todas as rotas da API
func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	// Rota de health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "PDV API está funcionando"})
	})



	// Grupo de rotas da API
	api := r.Group("/api/v1")

	// Rotas de autenticação
	auth := api.Group("/auth")
	{
		// Rota pública
		auth.POST("/login", controllers.Login)
		
		// Rotas protegidas de autenticação
		authProtected := auth.Group("/")
		authProtected.Use(middleware.AuthMiddleware())
		{
			authProtected.GET("/profile", controllers.GetProfile)
			authProtected.PUT("/change-password", controllers.ChangePassword)
		}
	}

	// Rotas protegidas (requerem autenticação)
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{

		// Produtos
		products := protected.Group("/products")
		{
			products.GET("/", controllers.GetProducts)
			products.GET("/:id", controllers.GetProduct)
			products.GET("/barcode/:barcode", controllers.GetProductByBarcode)
			products.POST("/", middleware.ManagerOrAdminMiddleware(), controllers.CreateProduct)
			products.PUT("/:id", middleware.ManagerOrAdminMiddleware(), controllers.UpdateProduct)
			products.DELETE("/:id", middleware.AdminMiddleware(), controllers.DeleteProduct)
			products.PUT("/:id/stock", middleware.ManagerOrAdminMiddleware(), controllers.UpdateStock)
		}

		// Categorias
		categories := protected.Group("/categories")
		{
			categories.GET("/", controllers.GetCategories)
			categories.GET("/:id", controllers.GetCategory)
			categories.POST("/", middleware.ManagerOrAdminMiddleware(), controllers.CreateCategory)
			categories.PUT("/:id", middleware.ManagerOrAdminMiddleware(), controllers.UpdateCategory)
			categories.DELETE("/:id", middleware.AdminMiddleware(), controllers.DeleteCategory)
		}

		// Vendas
		sales := protected.Group("/sales")
		{
			sales.GET("/", controllers.GetSales)
			sales.GET("/:id", controllers.GetSale)
			sales.POST("/", controllers.CreateSale)
			sales.PUT("/:id/cancel", middleware.ManagerOrAdminMiddleware(), controllers.CancelSale)
			sales.GET("/report", middleware.ManagerOrAdminMiddleware(), controllers.GetSalesReport)
		}

		// Usuários (apenas admin)
		users := protected.Group("/users")
		users.Use(middleware.AdminMiddleware())
		{
			users.GET("/", controllers.GetUsers)
			users.GET("/:id", controllers.GetUser)
			users.POST("/", controllers.CreateUser)
			users.PUT("/:id", controllers.UpdateUser)
			users.DELETE("/:id", controllers.DeleteUser)
		}

		// Dashboard (gerentes e admins)
		dashboard := protected.Group("/dashboard")
		dashboard.Use(middleware.ManagerOrAdminMiddleware())
		{
			dashboard.GET("/stats", controllers.GetDashboardStats)
			dashboard.GET("/low-stock", controllers.GetLowStockProducts)
			dashboard.GET("/top-products", controllers.GetTopProducts)
		}


	}


}