# Test 1: Health check de la API
GET {{host}}/
HTTP 200
[Asserts]
jsonpath "$.status" exists

# Test 2: Crear un cliente con tarjeta Platinum
POST {{host}}/client
Content-Type: application/json
{
  "name": "Juan Pérez",
  "country": "Colombia",
  "monthlyIncome": 1500,
  "viseClub": true,
  "cardType": "Platinum"
}
HTTP 200
[Captures]
clientId: jsonpath "$.clientId"
[Asserts]
jsonpath "$.status" == "Registered"
jsonpath "$.cardType" == "Platinum"
jsonpath "$.clientId" exists

# Test 3: Crear un cliente con tarjeta Gold
POST {{host}}/client
Content-Type: application/json
{
  "name": "María González",
  "country": "México",
  "monthlyIncome": 800,
  "viseClub": false,
  "cardType": "Gold"
}
HTTP 200
[Captures]
clientId2: jsonpath "$.clientId"
[Asserts]
jsonpath "$.status" == "Registered"
jsonpath "$.cardType" == "Gold"

# Test 4: Realizar una compra con descuento (Platinum en lunes)
POST {{host}}/purchase
Content-Type: application/json
{
  "clientId": {{clientId}},
  "amount": 250,
  "currency": "USD",
  "purchaseDate": "2025-11-17T14:30:00Z",
  "purchaseCountry": "France"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "Approved"
jsonpath "$.purchase.discountApplied" > 0
jsonpath "$.purchase.finalAmount" < 250

# Test 5: Realizar compra sin descuento (monto bajo)
POST {{host}}/purchase
Content-Type: application/json
{
  "clientId": {{clientId2}},
  "amount": 50,
  "currency": "USD",
  "purchaseDate": "2025-11-16T10:00:00Z",
  "purchaseCountry": "México"
}
HTTP 200
[Asserts]
jsonpath "$.status" == "Approved"
jsonpath "$.purchase.discountApplied" == 0

# Test 6: Intentar crear cliente sin campos requeridos (debe fallar)
POST {{host}}/client
Content-Type: application/json
{
  "name": "Test Incompleto"
}
HTTP 400
[Asserts]
jsonpath "$.status" == "Rejected"
jsonpath "$.error" contains "Faltan campos"

# Test 7: Intentar compra con cliente inexistente (debe fallar)
POST {{host}}/purchase
Content-Type: application/json
{
  "clientId": 99999,
  "amount": 100,
  "currency": "USD",
  "purchaseDate": "2025-11-16T10:00:00Z",
  "purchaseCountry": "Colombia"
}
HTTP 404
[Asserts]
jsonpath "$.status" == "Rejected"
jsonpath "$.error" contains "no registrado"

# Test 8: Listar todos los clientes
GET {{host}}/clients
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$[*].clientId" exists