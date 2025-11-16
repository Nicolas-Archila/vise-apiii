# Imagen base ligera de Nginx (Alpine = versión mínima)
FROM nginx:alpine

# Copiamos nuestra configuración de Nginx personalizada
# Sobrescribe la configuración por defecto
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos el index.html al directorio que Nginx usa para servir archivos
COPY index.html /usr/share/nginx/html/index.html
