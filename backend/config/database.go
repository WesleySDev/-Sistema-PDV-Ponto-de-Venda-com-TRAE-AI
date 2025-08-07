package config

import (
	"fmt"
	"log"
	"os"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"pdv-backend/models"
)

var DB *gorm.DB

func InitDB() {
	dbType := os.Getenv("DB_TYPE")
	if dbType == "" {
		dbType = "sqlite" // padrão
	}

	var err error

	if dbType == "postgres" {
		// Configuração PostgreSQL
		host := os.Getenv("DB_HOST")
		if host == "" {
			host = "localhost"
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}
		dbname := os.Getenv("DB_NAME")
		if dbname == "" {
			dbname = "pdv_db"
		}
		user := os.Getenv("DB_USER")
		if user == "" {
			user = "postgres"
		}
		password := os.Getenv("DB_PASSWORD")
		if password == "" {
			password = "postgres"
		}
		sslmode := os.Getenv("DB_SSLMODE")
		if sslmode == "" {
			sslmode = "disable"
		}

		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			host, user, password, dbname, port, sslmode)

		DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatal("Falha ao conectar com PostgreSQL:", err)
		}
		log.Println("Conexão com PostgreSQL estabelecida")
	} else {
		// Configuração SQLite (padrão)
		dbPath := os.Getenv("DB_PATH")
		if dbPath == "" {
			dbPath = "pdv.db"
		}

		DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
		if err != nil {
			log.Fatal("Falha ao conectar com SQLite:", err)
		}
		log.Println("Conexão com SQLite estabelecida")
	}

	// Executar migrações
	runMigrations()
}

func runMigrations() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Product{},
		&models.Sale{},
		&models.SaleItem{},
	)

	if err != nil {
		log.Printf("Aviso durante migrações: %v", err)
		// Continuar mesmo com erros de constraint
	}

	log.Println("Migrações executadas com sucesso")

	// Criar usuário admin padrão se não existir
	createDefaultAdmin()

	// Criar dados de exemplo
	SeedData()
}

func createDefaultAdmin() {
	var count int64
	DB.Model(&models.User{}).Count(&count)

	if count == 0 {
		admin := models.User{
			Name:     "Administrador",
			Email:    "admin@pdv.com",
			Password: "admin123", // Será hasheada no modelo
			Role:     "admin",
			Active:   true,
		}

		if err := DB.Create(&admin).Error; err != nil {
			log.Printf("Erro ao criar usuário admin: %v", err)
		} else {
			log.Println("Usuário admin criado com sucesso")
			log.Println("Email: admin@pdv.com | Senha: admin123")
		}
	}
}