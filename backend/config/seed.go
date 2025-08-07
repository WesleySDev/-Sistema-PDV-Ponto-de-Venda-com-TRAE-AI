package config

import (
	"log"
	"pdv-backend/models"
)

// SeedData cria dados de exemplo para o sistema
func SeedData() {
	createDefaultCategories()
	createDefaultProducts()
}

func createDefaultCategories() {
	var count int64
	DB.Model(&models.Category{}).Count(&count)

	if count == 0 {
		categories := []models.Category{
			{
				Name:        "Bebidas",
				Description: "Refrigerantes, sucos e águas",
				Active:      true,
			},
			{
				Name:        "Alimentação",
				Description: "Produtos alimentícios diversos",
				Active:      true,
			},
			{
				Name:        "Higiene",
				Description: "Produtos de higiene pessoal",
				Active:      true,
			},
			{
				Name:        "Limpeza",
				Description: "Produtos de limpeza doméstica",
				Active:      true,
			},
		}

		for _, category := range categories {
			if err := DB.Create(&category).Error; err != nil {
				log.Printf("Erro ao criar categoria %s: %v", category.Name, err)
			} else {
				log.Printf("Categoria %s criada com sucesso", category.Name)
			}
		}
	}
}

func createDefaultProducts() {
	var count int64
	DB.Model(&models.Product{}).Count(&count)

	if count == 0 {
		// Buscar categorias criadas
		var bebidas, alimentacao, higiene, limpeza models.Category
		DB.Where("name = ?", "Bebidas").First(&bebidas)
		DB.Where("name = ?", "Alimentação").First(&alimentacao)
		DB.Where("name = ?", "Higiene").First(&higiene)
		DB.Where("name = ?", "Limpeza").First(&limpeza)

		products := []models.Product{
			// Bebidas
			{
				Name:        "Coca-Cola 350ml",
				Barcode:     "7894900011517",
				Description: "Refrigerante Coca-Cola lata 350ml",
				Price:       3.50,
				CostPrice:   2.00,
				Stock:       100,
				MinStock:    10,
				Unit:        "un",
				Active:      true,
				CategoryID:  bebidas.ID,
			},
			{
				Name:        "Água Mineral 500ml",
				Barcode:     "7891000100103",
				Description: "Água mineral natural 500ml",
				Price:       2.00,
				CostPrice:   1.20,
				Stock:       150,
				MinStock:    20,
				Unit:        "un",
				Active:      true,
				CategoryID:  bebidas.ID,
			},
			{
				Name:        "Suco de Laranja 1L",
				Barcode:     "7891000315507",
				Description: "Suco de laranja natural 1 litro",
				Price:       6.50,
				CostPrice:   4.00,
				Stock:       80,
				MinStock:    15,
				Unit:        "un",
				Active:      true,
				CategoryID:  bebidas.ID,
			},

			// Alimentação
			{
				Name:        "Pão de Açúcar 500g",
				Barcode:     "7891000053607",
				Description: "Pão de açúcar tradicional 500g",
				Price:       4.50,
				CostPrice:   3.00,
				Stock:       50,
				MinStock:    10,
				Unit:        "un",
				Active:      true,
				CategoryID:  alimentacao.ID,
			},
			{
				Name:        "Leite Integral 1L",
				Barcode:     "7891000100202",
				Description: "Leite integral UHT 1 litro",
				Price:       4.80,
				CostPrice:   3.50,
				Stock:       120,
				MinStock:    25,
				Unit:        "un",
				Active:      true,
				CategoryID:  alimentacao.ID,
			},
			{
				Name:        "Arroz Branco 5kg",
				Barcode:     "7891000244807",
				Description: "Arroz branco tipo 1 - 5kg",
				Price:       18.90,
				CostPrice:   14.00,
				Stock:       30,
				MinStock:    5,
				Unit:        "un",
				Active:      true,
				CategoryID:  alimentacao.ID,
			},

			// Higiene
			{
				Name:        "Sabonete Dove 90g",
				Barcode:     "7891150013711",
				Description: "Sabonete em barra Dove 90g",
				Price:       3.20,
				CostPrice:   2.10,
				Stock:       200,
				MinStock:    30,
				Unit:        "un",
				Active:      true,
				CategoryID:  higiene.ID,
			},
			{
				Name:        "Shampoo Seda 325ml",
				Barcode:     "7891150047426",
				Description: "Shampoo Seda Reconstrução 325ml",
				Price:       12.90,
				CostPrice:   8.50,
				Stock:       60,
				MinStock:    10,
				Unit:        "un",
				Active:      true,
				CategoryID:  higiene.ID,
			},

			// Limpeza
			{
				Name:        "Detergente Ypê 500ml",
				Barcode:     "7896098900116",
				Description: "Detergente líquido Ypê neutro 500ml",
				Price:       2.80,
				CostPrice:   1.90,
				Stock:       90,
				MinStock:    15,
				Unit:        "un",
				Active:      true,
				CategoryID:  limpeza.ID,
			},
			{
				Name:        "Papel Higiênico 4 rolos",
				Barcode:     "7891000315608",
				Description: "Papel higiênico folha dupla 4 rolos",
				Price:       8.50,
				CostPrice:   6.00,
				Stock:       40,
				MinStock:    8,
				Unit:        "un",
				Active:      true,
				CategoryID:  limpeza.ID,
			},
		}

		for _, product := range products {
			if err := DB.Create(&product).Error; err != nil {
				log.Printf("Erro ao criar produto %s: %v", product.Name, err)
			} else {
				log.Printf("Produto %s criado com sucesso (Código: %s)", product.Name, product.Barcode)
			}
		}

		log.Println("Produtos de exemplo criados com sucesso!")
		log.Println("Códigos de barras para teste:")
		log.Println("- Coca-Cola: 7894900011517")
		log.Println("- Água Mineral: 7891000100103")
		log.Println("- Suco de Laranja: 7891000315507")
		log.Println("- Pão de Açúcar: 7891000053607")
		log.Println("- Leite: 7891000100202")
	}
}