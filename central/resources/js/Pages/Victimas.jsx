import AdminLayout from '@/Layouts/AdminLayout'
import { Head, Link, usePage } from '@inertiajs/react'
import { useEffect, useState } from "react";
import axios from "axios";
import React from 'react';
import { Search, Filter, RefreshCw, Plus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye, Phone, Mail, Calendar, User, FileText, Building2, MapPin, Shield, AlertCircle } from 'lucide-react';

// FUNCIÓN PARA OBTENER LA RUTA BASE (para el menú y navegación)
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
        return `${protocol}//${hostname}`;
    }
    
    if (port === '8000') {
        return `${protocol}//${hostname}:8000`;
    }
    
    return `${protocol}//${hostname}`;
};

const API_BASE_URL = getApiBaseUrl();
const basePath = getBasePath();

export default function Victimas() {

  const { props } = usePage();
  const perfil = props.auth.user?.perfil;

  const [victimas, setVictimas] = useState([]);
  const [victimasOriginales, setVictimasOriginales] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchDocumento, setSearchDocumento] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    documento: "",
    primer_apellido: "",
    segundo_apellido: "",
    estado: "",
    activo: "",
    operador: "",
    distrito_judicial: "",
    todos: ""
  });

  // Verificar permiso
  if (perfil !== 'ADMIN' && perfil !== 'MONITOREADOR') {
    return (
      <AdminLayout>
        <Head title="Acceso Denegado" />
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Acceso Denegado</h2>
          <p className="text-gray-500 mt-2">No tienes permisos para ver esta página.</p>
          <Link href="/dashboard" className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
            Volver al Dashboard
          </Link>
        </div>
      </AdminLayout>
    );
  }

  useEffect(() => {
    fetchVictimas();
    fetchOperadores();
  }, []);

  const fetchVictimas = () => {
    axios.get(`${basePath}/api/victimas`)
      .then(res => {
        console.log('Datos recibidos:', res.data);
        setVictimasOriginales(res.data);
        setVictimas(res.data);
      })
      .catch(err => console.error(err));
  };

  const fetchOperadores = () => {
    axios.get(`${basePath}/api/operadores-telefonicos`)
      .then(res => {
        setOperadores(res.data);
      })
      .catch(err => console.error(err));
  };

  const toggleFiltersRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    console.log('Filtros aplicados:', filters);
    
    let filtered = [...victimasOriginales];
    
    if (filters.documento) {
      filtered = filtered.filter(v => v.documento && v.documento.toString().includes(filters.documento));
    }
    
    if (filters.primer_apellido) {
      filtered = filtered.filter(v => v.primer_apellido && v.primer_apellido.toLowerCase().includes(filters.primer_apellido.toLowerCase()));
    }
    
    if (filters.segundo_apellido) {
      filtered = filtered.filter(v => v.segundo_apellido && v.segundo_apellido.toLowerCase().includes(filters.segundo_apellido.toLowerCase()));
    }
    
    if (filters.estado) {
      filtered = filtered.filter(v => v.estado === filters.estado);
    }
    
    if (filters.activo !== "") {
      const activoValue = parseInt(filters.activo);
      filtered = filtered.filter(v => v.activo === activoValue || v.activo === filters.activo);
    }
    
    if (filters.operador) {
      filtered = filtered.filter(v => v.operador_telefonico?.nombre && v.operador_telefonico.nombre.toLowerCase().includes(filters.operador.toLowerCase()));
    }
    
    if (filters.distrito_judicial) {
      filtered = filtered.filter(v => v.distrito_judicial && v.distrito_judicial.toLowerCase().includes(filters.distrito_judicial.toLowerCase()));
    }
    
    console.log('Resultados filtrados:', filtered.length);
    
    setVictimas(filtered);
    setExpandedRow(null);
    setShowGlobalFilters(false);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({
      documento: "",
      primer_apellido: "",
      segundo_apellido: "",
      estado: "",
      activo: "",
      operador: "",
      distrito_judicial: "",
      todos: ""
    });
    setVictimas(victimasOriginales);
    setCurrentPage(1);
  };

  const filteredVictimas = victimas.filter(v => {
    if (searchDocumento && !v.documento?.toString().includes(searchDocumento)) return false;
    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      const matchesNombre = v.nombres?.toLowerCase().includes(searchLower);
      const matchesDocumento = v.documento?.toString().includes(globalSearch);
      const matchesApellido = v.primer_apellido?.toLowerCase().includes(searchLower);
      if (!matchesNombre && !matchesDocumento && !matchesApellido) return false;
    }
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVictimas = filteredVictimas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredVictimas.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const FiltrosMotor = () => (
    <div className="p-5">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Filter className="w-4 h-4 text-red-600" />
          Filtros avanzados
        </h3>
        <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
          Limpiar filtros
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">N° Documento</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Ingrese DNI"
            value={filters.documento}
            onChange={(e) => handleFilterChange("documento", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Primer apellido</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Apellido paterno"
            value={filters.primer_apellido}
            onChange={(e) => handleFilterChange("primer_apellido", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Segundo Apellido</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Apellido materno"
            value={filters.segundo_apellido}
            onChange={(e) => handleFilterChange("segundo_apellido", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
          <select 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filters.estado}
            onChange={(e) => handleFilterChange("estado", e.target.value)}
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
            <option value="SUSPENDIDO">Suspendido</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Activo</label>
          <select 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filters.activo}
            onChange={(e) => handleFilterChange("activo", e.target.value)}
          >
            <option value="">Todos</option>
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Operador</label>
          <select 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filters.operador}
            onChange={(e) => handleFilterChange("operador", e.target.value)}
          >
            <option value="">Seleccione un operador</option>
            {operadores.map(op => (
              <option key={op.id} value={op.nombre}>{op.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Distrito Judicial</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Distrito judicial"
            value={filters.distrito_judicial}
            onChange={(e) => handleFilterChange("distrito_judicial", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Búsqueda general</label>
          <input 
            type="text" 
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Cualquier campo..."
            value={filters.todos}
            onChange={(e) => handleFilterChange("todos", e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={applyFilters}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
        <button 
          onClick={resetFilters}
          className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Limpiar
        </button>
      </div>
    </div>
  );

  const getEstadoBadge = (victima) => {
    const activo = victima.activo === 1 || victima.activo === "1";
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1 ${activo ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {activo ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  return (
    <AdminLayout>
      <Head title="Víctimas" />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-6 h-6 text-red-600" />
              Víctimas Registradas
            </h1>
            <p className="text-sm text-gray-500 mt-1">Gestión de víctimas del sistema Botón de Pánico</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchVictimas} 
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <Link 
              href={`${basePath}/victimas/nuevo`}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Víctima
            </Link>
          </div>
        </div>
      </div>

      {/*  */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por documento..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={searchDocumento}
                onChange={(e) => setSearchDocumento(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowGlobalFilters(!showGlobalFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                showGlobalFilters 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtros
              {showGlobalFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Búsqueda global..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>
        </div>

        {showGlobalFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <FiltrosMotor />
          </div>
        )}
      </div>

      {/*  */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Documento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombres</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Primer Apellido</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Segundo Apellido</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentVictimas.map((v) => (
                <React.Fragment key={v.id}>
                  <tr 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => toggleFiltersRow(v.id)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.documento || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.nombres || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.primer_apellido || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.segundo_apellido || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-col gap-1">
                        {v.telefono && (
                          <span className="text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {v.telefono}
                          </span>
                        )}
                        {v.email_personal && (
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {v.email_personal}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getEstadoBadge(v)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`${basePath}/victimas/${v.idvictima}`}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="w-4 h-4" />
                        Ver detalle
                      </Link>
                    </td>
                  </tr>

                  {expandedRow === v.id && (
                    <tr className="bg-gray-50">
                      <td colSpan="7" className="p-0">
                        <div className="p-4 border-t border-gray-200">
                          <FiltrosMotor />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {currentVictimas.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No se encontraron víctimas registradas</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-500">
            Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredVictimas.length)} de {filteredVictimas.length} registros
          </div>
          
          <div className="flex gap-1">
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
            
            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              if (
                pageNumber === 1 ||
                pageNumber === totalPages ||
                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
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
              } else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
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

      <div className="mt-4 text-sm text-gray-500">
        En total se encontraron {filteredVictimas.length} víctima{filteredVictimas.length !== 1 ? 's' : ''}.
      </div>
    </AdminLayout>
  );
}