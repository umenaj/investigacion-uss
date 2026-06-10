import AdminLayout from '@/Layouts/AdminLayout'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { useEffect, useState } from "react";
import axios from "axios";
import { 
  Building2, 
  Search, 
  Plus, 
  RefreshCw, 
  Eye, 
  MapPin, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  X,
  Home,
  Briefcase
} from 'lucide-react';

//  FUNCIÓN PARA OBTENER LA RUTA BASE 
const getBasePath = () => {
    const { pathname } = window.location;
    if (pathname.includes('/boton-panico')) {
        return '/boton-panico/public';
    }
    return '';
};

// FETCH (API)
const getApiBaseUrl = () => {
    const { protocol, hostname, port, pathname } = window.location;
    
    if (pathname.includes('/boton-panico')) {
        return `${protocol}//${hostname}/boton-panico/public`;
    }
    
    if (port === '8000') {
        return `${protocol}//${hostname}:8000`;
    }
    
    return `${protocol}//${hostname}`;
};

const API_BASE_URL = getApiBaseUrl();
const basePath = getBasePath();

export default function Instituciones() {

  const { props } = usePage();
  const perfil = props.auth.user?.perfil;

  const [instituciones, setInstituciones] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    distrito_judicial: "",
    tipo: ""
  });

  // Verificar permiso - Solo ADMIN puede ver esta página
  if (perfil !== 'ADMIN') {
    return (
      <AdminLayout>
        <Head title="Acceso Denegado" />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-500 mt-2">No tienes permisos para ver esta página.</p>
          <Link href={`${basePath}/dashboard`} className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Volver al Dashboard
          </Link>
        </div>
      </AdminLayout>
    );
  }

  useEffect(() => {
    fetchInstituciones();
  }, []);

  const fetchInstituciones = () => {
    setLoading(true);
    axios.get(`${basePath}/api/instituciones`)
      .then(res => {
        setInstituciones(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // filtros locales
  const filteredInstituciones = instituciones.filter(inst => {
    if (search && !inst.nombre?.toLowerCase().includes(search.toLowerCase()) &&
        !inst.direccion?.toLowerCase().includes(search.toLowerCase()) &&
        !inst.distrito_judicial?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filters.distrito_judicial && inst.distrito_judicial !== filters.distrito_judicial) return false;
    if (filters.tipo && inst.tipo !== filters.tipo) return false;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentInstituciones = filteredInstituciones.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInstituciones.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const resetFilters = () => {
    setFilters({
      distrito_judicial: "",
      tipo: ""
    });
    setSearch("");
    setCurrentPage(1);
  };

  // distritos judiciales 
  const distritosJudiciales = [...new Set(instituciones.map(i => i.distrito_judicial).filter(Boolean))];
  const tipos = [...new Set(instituciones.map(i => i.tipo).filter(Boolean))];

  return (
    <AdminLayout>
      <Head title="Instituciones" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-red-600" />
          Mantenimiento de Instituciones
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de instituciones colaboradoras del sistema</p>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, dirección o distrito judicial..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showFilters 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button 
              onClick={fetchInstituciones}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={() => router.visit(`${basePath}/instituciones/nuevo`)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Institución
            </button>
          </div>
        </div>

        {/* Filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Distrito Judicial</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={filters.distrito_judicial}
                  onChange={(e) => setFilters({...filters, distrito_judicial: e.target.value})}
                >
                  <option value="">Todos</option>
                  {distritosJudiciales.map(dist => <option key={dist} value={dist}>{dist}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={filters.tipo}
                  onChange={(e) => setFilters({...filters, tipo: e.target.value})}
                >
                  <option value="">Todos</option>
                  {tipos.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de instituciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  Dirección
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Briefcase className="w-3 h-3 inline mr-1" />
                  Distrito Judicial
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="animate-spin h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-gray-500">Cargando instituciones...</span>
                    </div>
                  </td>
                </tr>
              ) : currentInstituciones.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-12 h-12 text-gray-300" />
                      <span className="text-gray-500">No se encontraron instituciones</span>
                      <button 
                        onClick={() => router.visit(`${basePath}/instituciones/nuevo`)}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Crear nueva institución
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentInstituciones.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {inst.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {inst.direccion || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {inst.distrito_judicial || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`${basePath}/instituciones/${inst.id}`}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {!loading && filteredInstituciones.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500">
            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredInstituciones.length)} de {filteredInstituciones.length} registros
          </div>
          
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => paginate(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &lt;
            </button>
            
            {totalPages > 0 && [...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
              ) {
                return (
                  <button
                    key={pageNumber}
                    onClick={() => paginate(pageNumber)}
                    className={`px-3 py-1.5 border rounded-lg text-sm transition-colors ${
                      currentPage === pageNumber
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              } else if (
                pageNumber === currentPage - 3 ||
                pageNumber === currentPage + 3
              ) {
                return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &gt;
            </button>
            <button
              onClick={() => paginate(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      )}

      {/* Total de registros */}
      {!loading && filteredInstituciones.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          En total se encontraron {filteredInstituciones.length} institución{filteredInstituciones.length !== 1 ? 'es' : ''}.
        </div>
      )}

    </AdminLayout>
  );
}