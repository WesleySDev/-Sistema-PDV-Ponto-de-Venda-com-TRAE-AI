package models

import (
	"time"
)

type Product struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Barcode     string    `json:"barcode" gorm:"uniqueIndex"`
	Description string    `json:"description"`
	Price       float64   `json:"price" gorm:"not null"`
	CostPrice   float64   `json:"cost_price"`
	Stock       int       `json:"stock" gorm:"default:0"`
	MinStock    int       `json:"min_stock" gorm:"default:0"`
	Unit        string    `json:"unit" gorm:"default:un"` // un, kg, l, etc
	Active      bool      `json:"active" gorm:"default:true"`
	CategoryID  uint      `json:"category_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relacionamentos
	Category  Category   `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
	SaleItems []SaleItem `json:"-" gorm:"foreignKey:ProductID"`
}

// ProductRequest representa os dados de entrada para criar/atualizar produto
type ProductRequest struct {
	Name        string   `json:"name" binding:"required,min=2,max=200"`
	Barcode     string   `json:"barcode" binding:"max=50"`
	Description string   `json:"description" binding:"max=1000"`
	Price       *float64 `json:"price" binding:"required,gt=0"`
	CostPrice   *float64 `json:"cost_price" binding:"omitempty,gte=0"`
	Stock       *int     `json:"stock" binding:"omitempty,gte=0"`
	MinStock    *int     `json:"min_stock" binding:"omitempty,gte=0"`
	Unit        string   `json:"unit" binding:"max=10"`
	Active      *bool    `json:"active"`
	CategoryID  *uint    `json:"category_id" binding:"required"`
}

// ProductResponse representa a resposta do produto
type ProductResponse struct {
	ID          uint             `json:"id"`
	Name        string           `json:"name"`
	Barcode     string           `json:"barcode"`
	Description string           `json:"description"`
	Price       float64          `json:"price"`
	CostPrice   float64          `json:"cost_price"`
	Stock       int              `json:"stock"`
	MinStock    int              `json:"min_stock"`
	Unit        string           `json:"unit"`
	Active      bool             `json:"active"`
	CategoryID  uint             `json:"category_id"`
	Category    CategoryResponse `json:"category,omitempty"`
	CreatedAt   time.Time        `json:"created_at"`
	UpdatedAt   time.Time        `json:"updated_at"`
	LowStock    bool             `json:"low_stock"`
}

// ToResponse converte Product para ProductResponse
func (p *Product) ToResponse() ProductResponse {
	return ProductResponse{
		ID:          p.ID,
		Name:        p.Name,
		Barcode:     p.Barcode,
		Description: p.Description,
		Price:       p.Price,
		CostPrice:   p.CostPrice,
		Stock:       p.Stock,
		MinStock:    p.MinStock,
		Unit:        p.Unit,
		Active:      p.Active,
		CategoryID:  p.CategoryID,
		Category:    p.Category.ToResponse(),
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
		LowStock:    p.Stock <= p.MinStock,
	}
}

// IsLowStock verifica se o produto está com estoque baixo
func (p *Product) IsLowStock() bool {
	return p.Stock <= p.MinStock
}

// UpdateStock atualiza o estoque do produto
func (p *Product) UpdateStock(quantity int) {
	p.Stock += quantity
	if p.Stock < 0 {
		p.Stock = 0
	}
}