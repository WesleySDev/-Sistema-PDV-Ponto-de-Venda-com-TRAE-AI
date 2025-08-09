package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	OrganizationID *uint     `json:"organization_id" gorm:"index"` // Referência à organização
	StoreID        *uint     `json:"store_id" gorm:"index"`        // Loja específica (para multi-loja)
	Name           string    `json:"name" gorm:"not null"`
	Email          string    `json:"email" gorm:"uniqueIndex;not null"`
	Password       string    `json:"-" gorm:"not null"`
	Role           string    `json:"role" gorm:"default:cashier"` // admin, manager, cashier, owner
	Permissions    string    `json:"permissions" gorm:"type:text"` // JSON com permissões específicas
	Active         bool      `json:"active" gorm:"default:true"`
	LastLogin      *time.Time `json:"last_login"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// BeforeCreate hook para hashear a senha antes de salvar
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// BeforeUpdate hook para hashear a senha se ela foi alterada
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Password") && u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// CheckPassword verifica se a senha fornecida está correta
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// UserResponse representa a resposta do usuário sem a senha
type UserResponse struct {
	ID             uint       `json:"id"`
	OrganizationID *uint      `json:"organization_id"`
	StoreID        *uint      `json:"store_id"`
	Name           string     `json:"name"`
	Email          string     `json:"email"`
	Role           string     `json:"role"`
	Permissions    string     `json:"permissions"`
	Active         bool       `json:"active"`
	LastLogin      *time.Time `json:"last_login"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// ToResponse converte User para UserResponse
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:             u.ID,
		OrganizationID: u.OrganizationID,
		StoreID:        u.StoreID,
		Name:           u.Name,
		Email:          u.Email,
		Role:           u.Role,
		Permissions:    u.Permissions,
		Active:         u.Active,
		LastLogin:      u.LastLogin,
		CreatedAt:      u.CreatedAt,
		UpdatedAt:      u.UpdatedAt,
	}
}