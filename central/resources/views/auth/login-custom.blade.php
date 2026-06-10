<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Botón de Pánico</title>

    @vite(['resources/css/app.css', 'resources/js/app.js'])

    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #e9edf2;
        }

        .topbar {
            background: #980000;
            height: 45px;
            color: white;
            display: flex;
            align-items: center;
            padding-left: 20px;
            font-size: 14px;
            font-weight: bold;
        }

        .main-container {
            width: 100%;
            min-height: calc(100vh - 90px);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 70px;
            padding: 40px;
            box-sizing: border-box;
        }

        .left-panel {
            width: 700px;
            text-align: center;
        }

        .left-panel h1 {
            font-size: 42px;
            color: #444;
            font-weight: 300;
            margin-bottom: 40px;
        }

        .image-box {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .image-box img {
            width: 100%;
            max-width: 500px;
        }

        .description {
            margin-top: 30px;
            font-size: 22px;
            color: #555;
            line-height: 1.5;
        }

        .login-card {
            width: 380px;
            background: white;
            border-radius: 15px;
            padding: 35px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        .login-title {
            font-size: 42px;
            color: #980000;
            margin-bottom: 25px;
            font-weight: 300;
        }

        .input-group {
            margin-bottom: 20px;
        }

        .input-group input {
            width: 100%;
            padding: 14px;
            border: 1px solid #bbb;
            border-radius: 8px;
            font-size: 16px;
            box-sizing: border-box;
        }

        .btn-login {
            width: 100%;
            background: #b01919;
            color: white;
            border: none;
            padding: 15px;
            border-radius: 10px;
            font-size: 18px;
            cursor: pointer;
            transition: 0.3s;
        }

        .btn-login:hover {
            background: #870000;
        }

        .footer {
            background: #980000;
            height: 45px;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 13px;
        }

        @media (max-width: 1200px) {
            .main-container {
                flex-direction: column;
            }

            .left-panel {
                width: 100%;
            }
        }
    </style>
</head>
<body>

<div class="topbar">
    PODER JUDICIAL DEL PERÚ
</div>

<div class="main-container">

    <div class="left-panel">
        <h1>
            Sistema de Auxilio para las Víctimas de Violencia<br>
            Botón de Pánico
        </h1>

        <div class="image-box">
            <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Mapa">
        </div>

        <div class="description">
            Permite realizar la administración, monitoreo y seguimiento a víctimas
            de violencia mediante el aplicativo móvil Botón de Pánico.
        </div>
    </div>

    <div class="login-card">

        <div class="login-title">
            Iniciar sesión
        </div>

        <form method="POST" action="{{ route('login') }}">
            @csrf

            <div class="input-group">
                <input type="text" name="documento" placeholder="Documento" required>
            </div>

            <div class="input-group">
                <input type="password" name="password" placeholder="Contraseña" required>
            </div>

            <button class="btn-login" type="submit">
                INGRESAR
            </button>
        </form>

    </div>

</div>

<div class="footer">
    Copyright © 2026 - Sistema Inteligente Botón de Pánico
</div>

</body>
</html>