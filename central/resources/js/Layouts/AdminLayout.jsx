import { useState, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Bell, Menu, X, User, LogOut, Key, Home, Users, Building2, FileText, MapPin, BarChart3, Shield, AlertTriangle, Phone, Mail } from 'lucide-react'

// ✅ FUNCIÓN PARA OBTENER LA RUTA BASE (SOLO PARA EL MENÚ)
const getBasePath = () => {
    const { pathname } = window.location;
    
    // Caso: Desarrollo local con /boton-panico/public
    if (pathname.includes('/boton-panico')) {
        return '/boton-panico/public';
    }
    
    // Caso: Producción o cualquier otro
    return '';
};

// ✅ CONFIGURACIÓN PARA FETCH (API) - CORREGIDA
const getApiBaseUrl = () => {
    const { protocol, hostname, port, pathname } = window.location;
    
    // CASO: Estás en http://localhost/boton-panico/public/...
    // Las APIs están en la raíz: http://localhost/api/...
    if (pathname.includes('/boton-panico')) {
        // IMPORTANTE: Devolver SOLO el host, sin la subcarpeta
        return `${protocol}//${hostname}`;
    }
    
    // CASO: Desarrollo local con puerto 8000 (php artisan serve)
    if (port === '8000') {
        return `${protocol}//${hostname}:8000`;
    }
    
    // CASO: Producción o IP
    return `${protocol}//${hostname}`;
};

const API_BASE_URL = getApiBaseUrl();
console.log('🌐 API_BASE_URL:', API_BASE_URL); // Para debug - puedes eliminar después

export default function AdminLayout({ children }) {

    const [openMenu, setOpenMenu] = useState(false)
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [showNotifications, setShowNotifications] = useState(false)

    const { props, url } = usePage()
    const user = props.auth.user
    const perfil = user?.perfil
    const alertasPendientes = props.alertasPendientes || 0

    // OBTENER LA RUTA BASE UNA SOLA VEZ
    const basePath = getBasePath();

    // useEffect PARA NOTIFICACIONES 
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const response = await fetch(`${basePath}/api/notificaciones`)
                if (response.ok) {
                    const data = await response.json()
                    setNotifications(data.slice(0, 5))
                } else {
                    console.log('API respondió con error:', response.status)
                    setNotifications([])
                }
            } catch (error) {
                console.log('Error cargando notificaciones:', error.message)
                setNotifications([])
            }
        }
        loadNotifications()
        
        const interval = setInterval(() => {
            fetch(`${basePath}/api/alertas-pendientes-count`)
                .then(res => {
                    if (res.ok) return res.json()
                    throw new Error('API no disponible')
                })
                .then(data => {
                    if (data.count > 0) {
                        if (Notification.permission === 'granted') {
                            new Notification('Nueva Alerta de Pánico', {
                                body: `${data.count} alerta(s) pendiente(s)`,
                                icon: '/favicon.ico'
                            })
                        }
                    }
                })
                .catch(err => console.log('Error fetching alerts:', err.message))
        }, 30000)
        
        return () => clearInterval(interval)
    }, [])

    // useEffect PARA PERMISO DE NOTIFICACIONES
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    const getMenuItems = () => {
        if (perfil === 'ADMIN') {
            return [
                { text: 'Dashboard', href: `${basePath}/dashboard`, icon: Home, color: 'text-blue-500' },
                { text: 'Monitoreo', href: `${basePath}/monitoreo`, icon: MapPin, color: 'text-red-500', badge: alertasPendientes },
                { text: 'Víctimas', href: `${basePath}/victimas`, icon: Users, color: 'text-green-500' },
                { text: 'Usuarios Web', href: `${basePath}/usuarios-web`, icon: User, color: 'text-purple-500' },
                { text: 'Instituciones', href: `${basePath}/instituciones`, icon: Building2, color: 'text-orange-500' },
                { text: 'Reportes', href: `${basePath}/reportes`, icon: FileText, color: 'text-cyan-500' },
                { text: 'Estadísticas', href: `${basePath}/estadisticas`, icon: BarChart3, color: 'text-indigo-500' },
            ]
        }
        
        if (perfil === 'MONITOREADOR') {
            return [
                { text: 'Monitoreo', href: `${basePath}/monitoreo`, icon: MapPin, color: 'text-red-500', badge: alertasPendientes },
                { text: 'Mis Reportes', href: `${basePath}/mis-reportes`, icon: FileText, color: 'text-cyan-500' },
            ]
        }
        
        return [
            { text: 'Dashboard', href: `${basePath}/dashboard`, icon: Home, color: 'text-blue-500' },
        ]
    }

    const menuItems = getMenuItems()

    // ruta de cambiar contraseña y logout
    const handleCambiarContrasena = () => {
        router.get(`${basePath}/cambiar-contrasena`)
    }

    const handleLogout = () => {
        router.post(`${basePath}/logout`)
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
            
            {/* Sidebar para desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white shadow-xl z-20">
                {/* Logo */}
                <div className="bg-gradient-to-r from-red-800 to-red-700 p-5">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl">🚨</span>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg">Botón de Pánico</h1>
                            <p className="text-white/70 text-xs">Sistema de Monitoreo</p>
                        </div>
                    </div>
                </div>

                {/* Menú de navegación */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon
                        const active = url === item.href || (item.href !== '/' && url.startsWith(item.href))
                        
                        return (
                            <div
                                key={index}
                                onClick={() => router.get(item.href)}
                                className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                    active
                                        ? 'bg-red-50 text-red-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className={`w-5 h-5 ${active ? 'text-red-600' : item.color}`} />
                                    <span className={`text-sm font-medium ${active ? 'font-semibold' : ''}`}>
                                        {item.text}
                                    </span>
                                </div>
                                {item.badge > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Footer del sidebar */}
                <div className="p-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <Shield className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.nombres} {user?.primer_apellido}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.perfil}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Contenido principal */}
            <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Header  */}
                <header className="bg-white shadow-sm sticky top-0 z-10">
                    <div className="px-4 py-3 flex items-center justify-between">
                        
                        {/* Menú móvil y título */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <h1 className="text-lg font-semibold text-gray-800 lg:hidden">
                                Botón de Pánico
                            </h1>
                        </div>

                        {/* Campana y Usuario */}
                        <div className="flex items-center gap-4">
                            
                            {/* Notificaciones */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <Bell className="w-5 h-5" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                                    )}
                                </button>
                                
                                {/* Dropdown notificaciones */}
                                {showNotifications && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowNotifications(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                            <div className="p-3 border-b bg-gradient-to-r from-red-50 to-orange-50">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-800">
                                                        <Bell className="w-4 h-4 inline mr-2 text-red-600" />
                                                        Notificaciones
                                                    </h3>
                                                    {notifications.length > 0 && (
                                                        <span className="text-xs text-red-600">{notifications.length} nueva(s)</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-6 text-center text-gray-500">
                                                        <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">No hay notificaciones</p>
                                                    </div>
                                                ) : (
                                                    notifications.map((notif, idx) => (
                                                        <div key={idx} className="p-3 border-b hover:bg-gray-50 cursor-pointer transition-colors">
                                                            <div className="flex items-start gap-2">
                                                                <div className="w-2 h-2 mt-2 bg-red-500 rounded-full"></div>
                                                                <div>
                                                                    <p className="text-sm text-gray-800">{notif.mensaje}</p>
                                                                    <p className="text-xs text-gray-400 mt-1">{notif.tiempo}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="p-2 border-t bg-gray-50">
                                                <button className="w-full text-center text-xs text-red-600 hover:text-red-700 py-1">
                                                    Ver todas las notificaciones
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Separador */}
                            <div className="w-px h-6 bg-gray-200"></div>

                            {/* Usuario con dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenMenu(!openMenu)}
                                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-9 h-9 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center text-white shadow-md">
                                        <span className="text-sm font-medium">
                                            {user?.nombre?.charAt(0)}{user?.primer_apellido?.charAt(0)}{user?.segundo_apellido?.charAt(0)}
                                        </span>
                                    </div>
                                    <span className="hidden md:block text-sm font-medium text-gray-700">
                                        {user?.nombre} {user?.primer_apellido}
                                    </span>
                                    <svg className="hidden md:block w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown usuario */}
                                {openMenu && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40"
                                            onClick={() => setOpenMenu(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                            <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
                                                        {user?.nombre?.charAt(0)}{user?.primer_apellido?.charAt(0)}{user?.segundo_apellido?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {user?.nombre} {user?.primer_apellido} {user?.segundo_apellido}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{user?.perfil}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {user?.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-2">
                                                {/* Información adicional */}
                                                <div className="px-3 py-2 mb-1">
                                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                                        <Phone className="w-3 h-3" />
                                                        Service Desk: Anexo 13990
                                                    </p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                        <Mail className="w-3 h-3" />
                                                        servicedesk@pj.gob.pe
                                                    </p>
                                                </div>
                                                
                                                <div className="border-t border-gray-100 my-1"></div>
                                                
                                                {(perfil === 'ADMIN' || perfil === 'MONITOREADOR') && (
                                                    <button
                                                        onClick={() => {
                                                            setOpenMenu(false)
                                                            handleCambiarContrasena()
                                                        }}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        <Key className="w-4 h-4 text-gray-500" />
                                                        Cambiar contraseña
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={() => {
                                                        setOpenMenu(false)
                                                        handleLogout()
                                                    }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-1"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Cerrar sesión
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Contenido dinámico */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="animate-fadeIn">
                        {children}
                    </div>
                </main>
            </div>

            {/* Sidebar móvil */}
            {mobileSidebarOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-xl z-40 lg:hidden animate-slideIn">
                        <div className="bg-gradient-to-r from-red-800 to-red-700 p-5 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xl">🚨</span>
                                </div>
                                <div>
                                    <h1 className="text-white font-bold text-lg">Botón de Pánico</h1>
                                    <p className="text-white/70 text-xs">Sistema de Monitoreo</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMobileSidebarOpen(false)}
                                className="text-white/70 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <nav className="px-4 py-6 space-y-1">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon
                                const active = url === item.href || (item.href !== '/' && url.startsWith(item.href))
                                
                                return (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            router.get(item.href)
                                            setMobileSidebarOpen(false)
                                        }}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all ${
                                            active
                                                ? 'bg-red-50 text-red-700'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={`w-5 h-5 ${active ? 'text-red-600' : item.color}`} />
                                            <span className="text-sm font-medium">{item.text}</span>
                                        </div>
                                        {item.badge > 0 && (
                                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </nav>
                        
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user?.nombres} {user?.primer_apellido}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user?.perfil}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        handleLogout()
                                        setMobileSidebarOpen(false)
                                    }}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </aside>
                </>
            )}
        </div>
    )
}

// Estilos CSS para animaciones
const styles = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
}
.animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
}
.animate-slideIn {
    animation: slideIn 0.3s ease-out;
}
`