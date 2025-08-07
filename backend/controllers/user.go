package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"pdv-backend/config"
	"pdv-backend/models"
)

// UserRequest representa os dados de entrada para criar/atualizar usuário
type UserRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=100"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"omitempty,min=6"`
	Role     string `json:"role" binding:"required,oneof=admin manager cashier"`
	Active   *bool  `json:"active"`
}

// GetUsers retorna todos os usuários
func GetUsers(c *gin.Context) {
	var users []models.User
	query := config.DB

	// Filtro por role
	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	// Filtro por status ativo
	if active := c.Query("active"); active != "" {
		query = query.Where("active = ?", active)
	}

	// Filtro de busca
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Order("name ASC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar usuários"})
		return
	}

	// Converter para response
	responses := make([]models.UserResponse, len(users))
	for i, user := range users {
		responses[i] = user.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetUser retorna um usuário específico
func GetUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

// CreateUser cria um novo usuário
func CreateUser(c *gin.Context) {
	var req UserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se a senha foi fornecida
	if req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Senha é obrigatória para novos usuários"})
		return
	}

	// Verificar se já existe um usuário com o mesmo email
	var existingUser models.User
	if err := config.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Já existe um usuário com este email"})
		return
	}

	// Criar usuário
	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Password: req.Password, // Será hasheada no hook BeforeCreate
		Role:     req.Role,
	}

	if req.Active != nil {
		user.Active = *req.Active
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar usuário"})
		return
	}

	c.JSON(http.StatusCreated, user.ToResponse())
}

// UpdateUser atualiza um usuário
func UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req UserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar usuário
	var user models.User
	if err := config.DB.First(&user, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Verificar se já existe outro usuário com o mesmo email
	var existingUser models.User
	if err := config.DB.Where("email = ? AND id != ?", req.Email, user.ID).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Já existe um usuário com este email"})
		return
	}

	// Verificar se o usuário está tentando alterar seu próprio role
	currentUserID, _ := c.Get("user_id")
	if currentUserID == user.ID && req.Role != user.Role {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível alterar seu próprio nível de acesso"})
		return
	}

	// Atualizar campos
	user.Name = req.Name
	user.Email = req.Email
	user.Role = req.Role

	if req.Active != nil {
		user.Active = *req.Active
	}

	// Atualizar senha apenas se fornecida
	if req.Password != "" {
		user.Password = req.Password // Será hasheada no hook BeforeUpdate
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar usuário"})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

// DeleteUser exclui um usuário
func DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Usuário não encontrado"})
		return
	}

	// Verificar se o usuário está tentando excluir a si mesmo
	currentUserID, _ := c.Get("user_id")
	if currentUserID == user.ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível excluir seu próprio usuário"})
		return
	}

	// Verificar se o usuário tem vendas associadas
	var saleCount int64
	config.DB.Model(&models.Sale{}).Where("user_id = ?", user.ID).Count(&saleCount)
	if saleCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível excluir usuário com vendas associadas"})
		return
	}

	if err := config.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao excluir usuário"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuário excluído com sucesso"})
}