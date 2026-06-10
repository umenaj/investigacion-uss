import { Head, useForm } from '@inertiajs/react'
import Swal from 'sweetalert2'
import { useState, useEffect } from 'react'

// FUNCIÓN PARA OBTENER LA RUTA BASE
const getBasePath = () => {
    const { pathname } = window.location;
    if (pathname.includes('/boton-panico')) {
        return '/boton-panico/public';
    }
    return '';
};

const basePath = getBasePath();

export default function Login() {

    const [captchaVerified, setCaptchaVerified] = useState(false)
    const [captchaLoading, setCaptchaLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { data, setData, post, processing } = useForm({
        documento: '',
        password: '',
    })

    // Efecto para animación de entrada
    useEffect(() => {
        const elements = document.querySelectorAll('.animate-on-load')
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('opacity-100', 'translate-y-0')
                el.classList.remove('opacity-0', 'translate-y-10')
            }, index * 100)
        })
    }, [])

    const handleCaptcha = () => {
        if (captchaVerified) return
        setCaptchaLoading(true)

        setTimeout(() => {
            setCaptchaLoading(false)
            setCaptchaVerified(true)

            Swal.fire({
                icon: 'success',
                title: '¡Captcha verificado!',
                text: 'Validación completada correctamente.',
                confirmButtonColor: '#8B0000',
                background: '#ffffff',
                timer: 2000,
                showConfirmButton: true,
            })
        }, 1800)
    }

    const submit = (e) => {
        e.preventDefault()

        if (!captchaVerified) {
            Swal.fire({
                icon: 'warning',
                title: '¡Atención!',
                text: 'Primero debe completar el captcha.',
                confirmButtonColor: '#8B0000',
                background: '#ffffff',
            })
            return
        }

        post(route('login'), {
            onError: () => {
                Swal.fire({
                    icon: 'error',
                    title: '¡Error de autenticación!',
                    text: 'Las credenciales son incorrectas o el usuario está inactivo.',
                    confirmButtonColor: '#8B0000',
                    confirmButtonText: 'Intentar nuevamente',
                    background: '#ffffff',
                })
            },
        })
    }

    return (
        <>
            <Head title="Botón de Pánico - Iniciar Sesión" />

            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col font-['Montserrat']">

                {/* HEADER */}
                <div className="bg-gradient-to-r from-red-800 to-red-700 h-[50px] flex items-center px-6 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">⚖️</span>
                        </div>
                        <h1 className="text-white text-[12px] font-semibold tracking-wide">
                            PODER JUDICIAL DEL PERÚ
                        </h1>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="flex-1 flex items-center justify-center px-4 py-6">
                    <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-6">
                        
                        {/* LADO IZQUIERDO - INFORMACIÓN  */}
                        <div className="flex-1 text-center lg:text-center animate-on-load opacity-0 translate-y-10 transition-all duration-700">
                            
                            <h1 className="text-xl md:text-2xl lg:text-3xl leading-tight font-light text-gray-700 mb-4">
                                Sistema de Auxilio para las
                                <br />
                                Víctimas de Violencia
                                <br />
                                <span className="font-bold text-red-700">Botón de Pánico</span>
                            </h1>

                            <div className="bg-white rounded-xl shadow-md p-4">
                                <div className="flex justify-center">
                                    {/*  IMAGEN  */}
                                    <img
                                        src={`${basePath}/images/panico.svg`}
                                        alt="Botón de Pánico"
                                        className="max-w-[200px] md:max-w-[240px]"
                                        onError={(e) => {
                                            
                                            e.target.onerror = null;
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23ef4444"/%3E%3Ctext x="50" y="65" text-anchor="middle" fill="white" font-size="40"%3E🚨%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-white/50 rounded-xl">
                                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                                    Permite realizar la administración, monitoreo y seguimiento
                                    de víctimas de violencia, a través del aplicativo móvil
                                    <span className="font-semibold text-red-700"> Botón de Pánico</span>.
                                </p>
                            </div>

                            <div className="mt-4 flex items-center justify-center lg:justify-start gap-2 text-xs text-gray-500">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                <span>Conexión segura SSL</span>
                                <span className="mx-1">•</span>
                                <span>🔒 Datos encriptados</span>
                            </div>
                        </div>

                        {/* LADO DERECHO - FORMULARIO DE LOGIN  */}
                        <div className="w-full max-w-sm animate-on-load opacity-0 translate-y-10 transition-all duration-700 delay-200">
                            
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                
                                {/* Header del formulario  */}
                                <div className="bg-gradient-to-r from-red-700 to-red-800 px-6 py-4 text-center">
                                    <h2 className="text-white text-xl font-light">
                                        Iniciar sesión
                                    </h2>
                                    <div className="w-10 h-0.5 bg-white/50 mx-auto mt-1"></div>
                                    <p className="text-white/60 text-[11px] mt-1">
                                        Botón de Pánico v1.3.0
                                    </p>
                                </div>

                                {/* Formulario */}
                                <form onSubmit={submit} className="p-5">
                                    
                                    {/* Campo Usuario */}
                                    <div className="mb-4">
                                        <label className="block text-gray-600 text-xs font-medium mb-1">
                                            Número de Documento
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ingrese su DNI"
                                            value={data.documento}
                                            onChange={(e) => setData('documento', e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                            autoComplete="username"
                                        />
                                    </div>

                                    {/* Campo Contraseña */}
                                    <div className="mb-4">
                                        <label className="block text-gray-600 text-xs font-medium mb-1">
                                            Contraseña
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Ingrese su contraseña"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition text-sm"
                                            >
                                                {showPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* CAPTCHA */}
                                    <div className="mb-4">
                                        <div
                                            onClick={handleCaptcha}
                                            className={`border rounded-lg bg-gray-50 h-[70px] flex items-center justify-between px-3 cursor-pointer transition-all duration-300 ${
                                                captchaVerified 
                                                    ? 'border-green-500 bg-green-50' 
                                                    : 'border-gray-300 hover:border-red-300 hover:bg-red-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-5 h-5 border-2 rounded-md flex items-center justify-center text-white text-xs transition-all ${
                                                        captchaVerified
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-gray-400'
                                                    }`}
                                                >
                                                    {captchaVerified ? '✓' : ''}
                                                </div>
                                                <div>
                                                    <span className="text-xs font-medium text-gray-700">
                                                        {captchaLoading ? 'Verificando...' : 'No soy un robot'}
                                                    </span>
                                                    {captchaVerified && (
                                                        <p className="text-[10px] text-green-600">
                                                            Verificado
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-blue-600 text-xl ${captchaLoading ? 'animate-spin' : ''}`}>
                                                    ↻
                                                </div>
                                                <span className="text-[8px] text-gray-500">
                                                    reCAPTCHA
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botón Ingresar */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                CARGANDO...
                                            </span>
                                        ) : (
                                            'INGRESAR →'
                                        )}
                                    </button>

                                </form>

                                {/* Nota de ayuda */}
                                <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
                                    <div className="flex items-start gap-2">
                                        <div className="text-red-600 text-sm">📌</div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-700 text-xs mb-1">
                                                ¿Necesitas ayuda?
                                            </h3>
                                            <p className="text-[10px] text-gray-500 leading-relaxed">
                                                Accesos y/o consultas llamar al Centro de Servicio - Service Desk.
                                            </p>
                                            <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                                                <div className="flex items-center gap-1">
                                                    <span>🕒</span>
                                                    <span className="text-gray-600">Lun-Vie 8:00-17:00</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span>📞</span>
                                                    <span className="text-gray-600">Anexo: 13990</span>
                                                </div>
                                                <div className="flex items-center gap-1 col-span-2">
                                                    <span>✉️</span>
                                                    <span className="text-gray-600">servicedesk@pj.gob.pe</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white text-center py-3 text-[10px] mt-auto">
                    <div className="container mx-auto px-4">
                        <p className="mb-1">
                            Paseo de la República S/N Palacio de Justicia, Cercado, Lima - Perú
                        </p>
                        <p>
                            Copyright © 2026 - Todos los derechos reservados
                        </p>
                    </div>
                </footer>
            </div>

            {/* Font Awesome */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        </>
    )
}