import AdminLayout from '@/Layouts/AdminLayout'
import { Head } from '@inertiajs/react'

export default function Dashboard() {

    return (
        <AdminLayout>

            <Head title="Dashboard" />

            <h1 className="text-xl font-semibold text-gray-700">
                Bienvenido al Sistema de Ayuda para Victimas
            </h1>

        </AdminLayout>
    )
}