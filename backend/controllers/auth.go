package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"pdv-backend/config"
	"pdv-backend/middleware"
	"pdv-backend/models"
)

// LoginRequest representa os dados de login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginResponse representa a resposta do login
type LoginResponse struct {
	Token string                `json:"token"`
	User  models.UserResponse   `json:"user"`
}

// Login autentica um usuário
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar usuário por email
	var user models.User
	if err := config.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Verificar se o usuário está ativo
	if !user.Active {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário inativo"})
		return
	}

	// Verificar senha
	if !user.CheckPassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Credenciais inválidas"})
		return
	}

	// Gerar token JWT
	token, err := middleware.GenerateToken(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao gerar token"})
		return
	}

	// Retornar resposta
	response := LoginResponse{
		Token: token,
		User:  user.ToResponse(),
	}

	c.JSON(http.StatusOK, response)
}

// GetProfile retorna o perfil do usuário autenticado
func GetProfile(c *gin.Context) {
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não encontrado"})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro interno do servidor"})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

// ChangePassword altera a senha do usuário autenticado
func ChangePassword(c *gin.Context) {
	type ChangePasswordRequest struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não encontrado"})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro interno do servidor"})
		return
	}

	// Verificar senha atual
	if !user.CheckPassword(req.CurrentPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Senha atual incorreta"})
		return
	}

	// Atualizar senha
	user.Password = req.NewPassword
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar senha"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Senha alterada com sucesso"})
}