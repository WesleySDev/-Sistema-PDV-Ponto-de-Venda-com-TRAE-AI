package models

import (
	"time"
)

type Sale struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	Total          float64   `json:"total" gorm:"not null"`
	Discount       float64   `json:"discount" gorm:"default:0"`
	Tax            float64   `json:"tax" gorm:"default:0"`
	FinalTotal     float64   `json:"final_total" gorm:"not null"`
	PaymentType    string    `json:"payment_type" gorm:"not null"` // dinheiro, cartao_credito, cartao_debito, pix
	AmountReceived *float64  `json:"amount_received" gorm:"default:null"` // valor recebido (apenas para dinheiro)
	Change         *float64  `json:"change" gorm:"default:null"` // troco (apenas para dinheiro)
	Status         string    `json:"status" gorm:"default:completed"` // completed, cancelled
	UserID         uint      `json:"user_id" gorm:"not null"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relacionamentos
	User      User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	SaleItems []SaleItem `json:"sale_items,omitempty" gorm:"foreignKey:SaleID"`
}

type SaleItem struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	SaleID    uint      `json:"sale_id" gorm:"not null"`
	ProductID uint      `json:"product_id" gorm:"not null"`
	Quantity  int       `json:"quantity" gorm:"not null"`
	UnitPrice float64   `json:"unit_price" gorm:"not null"`
	Total     float64   `json:"total" gorm:"not null"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relacionamentos
	Sale    Sale    `json:"-" gorm:"foreignKey:SaleID"`
	Product Product `json:"product,omitempty" gorm:"foreignKey:ProductID"`
}

// SaleRequest representa os dados de entrada para criar uma venda
type SaleRequest struct {
	Items              []SaleItemRequest `json:"items" binding:"required,min=1"`
	PaymentMethod      string            `json:"payment_method" binding:"required"`
	DiscountPercentage *float64          `json:"discount_percentage" binding:"omitempty,gte=0"`
	AmountReceived     *float64          `json:"amount_received" binding:"omitempty,gte=0"`
	Discount           *float64          `json:"discount" binding:"omitempty,gte=0"`
	Tax                *float64          `json:"tax" binding:"omitempty,gte=0"`
	PaymentType        string            `json:"payment_type" binding:"omitempty,oneof=cash card pix"`
}

type SaleItemRequest struct {
	ProductID uint `json:"product_id" binding:"required"`
	Quantity  int  `json:"quantity" binding:"required,gt=0"`
}

// SaleResponse representa a resposta da venda
type SaleResponse struct {
	ID             uint               `json:"id"`
	Total          float64            `json:"total"`
	Discount       float64            `json:"discount"`
	Tax            float64            `json:"tax"`
	FinalTotal     float64            `json:"final_total"`
	PaymentType    string             `json:"payment_type"`
	AmountReceived *float64           `json:"amount_received,omitempty"`
	Change         *float64           `json:"change,omitempty"`
	Status         string             `json:"status"`
	UserID         uint               `json:"user_id"`
	User           UserResponse       `json:"user,omitempty"`
	SaleItems      []SaleItemResponse `json:"sale_items,omitempty"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
}

type SaleItemResponse struct {
	ID        uint            `json:"id"`
	SaleID    uint            `json:"sale_id"`
	ProductID uint            `json:"product_id"`
	Quantity  int             `json:"quantity"`
	UnitPrice float64         `json:"unit_price"`
	Total     float64         `json:"total"`
	Product   ProductResponse `json:"product,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

// ToResponse converte Sale para SaleResponse
func (s *Sale) ToResponse() SaleResponse {
	saleItems := make([]SaleItemResponse, len(s.SaleItems))
	for i, item := range s.SaleItems {
		saleItems[i] = item.ToResponse()
	}

	return SaleResponse{
		ID:             s.ID,
		Total:          s.Total,
		Discount:       s.Discount,
		Tax:            s.Tax,
		FinalTotal:     s.FinalTotal,
		PaymentType:    s.PaymentType,
		AmountReceived: s.AmountReceived,
		Change:         s.Change,
		Status:         s.Status,
		UserID:         s.UserID,
		User:           s.User.ToResponse(),
		SaleItems:      saleItems,
		CreatedAt:      s.CreatedAt,
		UpdatedAt:      s.UpdatedAt,
	}
}

// ToResponse converte SaleItem para SaleItemResponse
func (si *SaleItem) ToResponse() SaleItemResponse {
	return SaleItemResponse{
		ID:        si.ID,
		SaleID:    si.SaleID,
		ProductID: si.ProductID,
		Quantity:  si.Quantity,
		UnitPrice: si.UnitPrice,
		Total:     si.Total,
		Product:   si.Product.ToResponse(),
		CreatedAt: si.CreatedAt,
		UpdatedAt: si.UpdatedAt,
	}
}

// CalculateTotal calcula o total da venda
func (s *Sale) CalculateTotal() {
	s.FinalTotal = s.Total - s.Discount + s.Tax
	if s.FinalTotal < 0 {
		s.FinalTotal = 0
	}
}