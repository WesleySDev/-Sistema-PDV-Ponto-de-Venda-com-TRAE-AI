package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"pdv-backend/config"
	"pdv-backend/models"
)

// GetCategories retorna todas as categorias
func GetCategories(c *gin.Context) {
	var categories []models.Category
	query := config.DB

	// Filtro por status ativo
	if active := c.Query("active"); active != "" {
		query = query.Where("active = ?", active)
	}

	// Filtro de busca
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ?", "%"+search+"%")
	}

	if err := query.Order("name ASC").Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar categorias"})
		return
	}

	// Converter para response
	responses := make([]models.CategoryResponse, len(categories))
	for i, category := range categories {
		responses[i] = category.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetCategory retorna uma categoria específica
func GetCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var category models.Category
	if err := config.DB.First(&category, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Categoria não encontrada"})
		return
	}

	c.JSON(http.StatusOK, category.ToResponse())
}

// CreateCategory cria uma nova categoria
func CreateCategory(c *gin.Context) {
	var req models.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verificar se já existe uma categoria com o mesmo nome
	var existingCategory models.Category
	if err := config.DB.Where("name = ?", req.Name).First(&existingCategory).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Já existe uma categoria com este nome"})
		return
	}

	// Criar categoria
	category := models.Category{
		Name:        req.Name,
		Description: req.Description,
	}

	if req.Active != nil {
		category.Active = *req.Active
	}

	if err := config.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar categoria"})
		return
	}

	c.JSON(http.StatusCreated, category.ToResponse())
}

// UpdateCategory atualiza uma categoria
func UpdateCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var req models.CategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Buscar categoria
	var category models.Category
	if err := config.DB.First(&category, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Categoria não encontrada"})
		return
	}

	// Verificar se já existe outra categoria com o mesmo nome
	var existingCategory models.Category
	if err := config.DB.Where("name = ? AND id != ?", req.Name, category.ID).First(&existingCategory).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Já existe uma categoria com este nome"})
		return
	}

	// Atualizar campos
	category.Name = req.Name
	category.Description = req.Description

	if req.Active != nil {
		category.Active = *req.Active
	}

	if err := config.DB.Save(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar categoria"})
		return
	}

	c.JSON(http.StatusOK, category.ToResponse())
}

// DeleteCategory exclui uma categoria
func DeleteCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var category models.Category
	if err := config.DB.First(&category, uint(id)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Categoria não encontrada"})
		return
	}

	// Verificar se a categoria tem produtos associados
	var productCount int64
	config.DB.Model(&models.Product{}).Where("category_id = ?", category.ID).Count(&productCount)
	if productCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Não é possível excluir categoria com produtos associados"})
		return
	}

	if err := config.DB.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao excluir categoria"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Categoria excluída com sucesso"})
}