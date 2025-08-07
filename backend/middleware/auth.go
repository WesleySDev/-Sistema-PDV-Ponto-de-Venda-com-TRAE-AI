package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"pdv-backend/config"
	"pdv-backend/models"
)

var jwtSecret = []byte(getJWTSecret())

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "pdv-secret-key-change-in-production"
	}
	return secret
}

// Claims representa as claims do JWT
type Claims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken gera um token JWT para o usuário
func GenerateToken(user *models.User) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pdv-system",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AuthMiddleware middleware de autenticação
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token de autorização requerido"})
			c.Abort()
			return
		}

		// Extrair token do header "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Formato de token inválido"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]
		claims := &Claims{}

		// Validar token
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token inválido"})
			c.Abort()
			return
		}

		// Verificar se o usuário ainda existe e está ativo
		var user models.User
		if err := config.DB.First(&user, claims.UserID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário não encontrado"})
			c.Abort()
			return
		}

		if !user.Active {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Usuário inativo"})
			c.Abort()
			return
		}

		// Adicionar informações do usuário ao contexto
		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("user", user)

		c.Next()
	}
}

// AdminMiddleware middleware para verificar se o usuário é admin
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Acesso negado"})
			c.Abort()
			return
		}

		if userRole != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a administradores"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ManagerOrAdminMiddleware middleware para verificar se o usuário é manager ou admin
func ManagerOrAdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Acesso negado"})
			c.Abort()
			return
		}

		if userRole != "admin" && userRole != "manager" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Acesso restrito a gerentes e administradores"})
			c.Abort()
			return
		}

		c.Next()
	}
}