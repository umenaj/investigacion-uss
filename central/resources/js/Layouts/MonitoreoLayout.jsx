import { useState, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Bell, Menu, X, User, LogOut, Key, Shield, Phone, Mail } from 'lucide-react'

// FUNCIÓN PARA OBTENER LA RUTA BASE
const getBasePath = () => {
    const { pathname } = window.location;
    if (pathname.includes('/boton-panico')) {
        return '/boton-panico/public';
    }
    return '';
};

const basePath = getBasePath();

export default function MonitoreoLayout({ children }) {

    const [openMenu, setOpenMenu] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)
    const [notifications, setNotifications] = useState([])

    const { props } = usePage()
    const user = props.auth.user
    const perfil = user?.perfil
    const alertasPendientes = props.alertasPendientes || 0

    // Cargar notificaciones
    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const response = await fetch(`${basePath}/api/notificaciones`)
                const data = await response.json()
                setNotifications(data.slice(0, 5))
            } catch (error) {
                console.log('Error cargando notificaciones')
            }
        }
        loadNotifications()
        
        const interval = setInterval(() => {
            fetch(`${basePath}/api/alertas-pendientes-count`)
                .then(res => res.json())
                .then(data => {
                    if (data.count > 0 && Notification.permission === 'granted') {
                        new Notification('Nueva Alerta de Pánico', {
                            body: `${data.count} alerta(s) pendiente(s)`,
                            icon: '/favicon.ico'
                        })
                    }
                })
        }, 30000)
        
        return () => clearInterval(interval)
    }, [])

    // Solicitar permiso para notificaciones
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    // Si no es MONITOREADOR, redirigir
    if (perfil !== 'MONITOREADOR') {
        router.visit(`${basePath}/dashboard`)
        return null
    }

    return (
        <div className="w-full h-screen bg-gray-100 overflow-hidden">
            
            {/* Header flotante solo para monitoreo */}
            <header className="fixed top-4 right-4 z-50">
                <div className="flex items-center gap-3">
                    
                    {/* Notificaciones */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {alertasPendientes > 0 && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                    <div className="p-3 border-b bg-gradient-to-r from-red-50 to-orange-50">
                                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                            <Bell className="w-4 h-4 text-red-600" />
                                            Notificaciones
                                        </h3>
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
                                                    <p className="text-sm text-gray-800">{notif.mensaje}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{notif.tiempo}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Usuario */}
                    <div className="relative">
                        <button
                            onClick={() => setOpenMenu(!openMenu)}
                            className="flex items-center gap-2 p-1 rounded-full bg-white shadow-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-9 h-9 bg-gradient-to-r from-red-600 to-red-700 rounded-full flex items-center justify-center text-white shadow-md">
                                <span className="text-sm font-medium">
                                    {user?.nombre?.charAt(0)}{user?.primer_apellido?.charAt(0)}
                                </span>
                            </div>
                        </button>

                        {openMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(false)} />
                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50">
                                        <p className="font-semibold text-gray-800">
                                            {user?.nombre} {user?.primer_apellido}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{user?.perfil}</p>
                                        <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
                                    </div>
                                    <div className="p-2 border-t border-gray-100">
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
                                        
                                        <button
                                            onClick={() => {
                                                setOpenMenu(false)
                                                router.get(`${basePath}/cambiar-contrasena`)
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Key className="w-4 h-4 text-gray-500" />
                                            Cambiar contraseña
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenMenu(false)
                                                router.post(`${basePath}/logout`)
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
            </header>

            {/* Contenido principal  */}
            <main className="w-full h-full">
                {children}
            </main>
        </div>
    )
}