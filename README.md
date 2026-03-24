# register

POST /api/v1/auth/register
{
"fullName": "Nguyen Chi Vi",
"email": "abc@gmail.com",
"password": "12345678",
"confirmPassword": "12345678"
}

# login

POST /api/v1/auth/login
{
"email": "abc@gmail.com",
"password": "12345678"
}

# me

GET /api/v1/auth/me
Authorization: Bearer <accessToken>

# refresh

POST /api/v1/auth/refresh
{
"refreshToken": "<refreshToken>"
}

# logout

POST /api/v1/auth/logout
{
"refreshToken": "<refreshToken>"
}

# forgot password

POST /api/v1/auth/forgot-password
{
"email": "abc@gmail.com"
}

# verify reset code

POST /api/v1/auth/reset-password/verify-code
{
"email": "abc@gmail.com",
"code": "123456"
}

# reset password

POST /api/v1/auth/reset-password
{
"email": "abc@gmail.com",
"code": "123456",
"newPassword": "newpass123",
"confirmPassword": "newpass123"
}
