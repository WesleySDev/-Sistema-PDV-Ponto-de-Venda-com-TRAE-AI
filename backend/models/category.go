package models

import (
	"time"
)

type Category struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	Active      bool      `json:"active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relacionamentos
	Products []Product `json:"products,omitempty" gorm:"foreignKey:CategoryID"`
}

// CategoryRequest representa os dados de entrada para criar/atualizar categoria
type CategoryRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=100"`
	Description string `json:"description" binding:"max=500"`
	Active      *bool  `json:"active"`
}

// CategoryResponse representa a resposta da categoria
type CategoryResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Active      bool      `json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ToResponse converte Category para CategoryResponse
func (c *Category) ToResponse() CategoryResponse {
	return CategoryResponse{
		ID:          c.ID,
		Name:        c.Name,
		Description: c.Description,
		Active:      c.Active,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}
}