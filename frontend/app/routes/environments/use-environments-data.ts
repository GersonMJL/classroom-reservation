import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { roomApi as environmentApi } from "../../services/api";
import type { Environment } from "../../services/api";
import type { EnvironmentSearchType } from "./types";

export function useEnvironmentsData() {
  const navigate = useNavigate();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchType, setSearchType] = useState<EnvironmentSearchType>("name");
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Auth check error:", err);
        navigate("/login");
      }
    };

    checkAdmin();
  }, [navigate]);

  const loadEnvironments = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const skip = (page - 1) * itemsPerPage;
      const data = await environmentApi.getAllRooms(skip, itemsPerPage);
      setEnvironments(data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar ambientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnvironments();
  }, []);

  const handleDeleteEnvironment = async (environmentId: number) => {
    if (window.confirm("Tem certeza de que deseja excluir este ambiente?")) {
      setLoading(true);
      try {
        await environmentApi.deleteRoom(environmentId);
        loadEnvironments();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao excluir ambiente");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError("Informe um valor para pesquisa");
      return;
    }

    setLoading(true);
    try {
      let results: Environment[] = [];
      if (searchType === "capacity") {
        const capacity = parseInt(searchValue, 10);
        if (isNaN(capacity) || capacity <= 0) {
          setError("Informe um número de capacidade válido");
          return;
        }
        results = await environmentApi.searchByCapacity(capacity);
      } else if (searchType === "location_id") {
        const locationId = parseInt(searchValue, 10);
        if (isNaN(locationId) || locationId <= 0) {
          setError("Informe um ID de localizacao valido");
          return;
        }
        results = await environmentApi.searchByLocation(locationId);
      } else {
        const all = await environmentApi.getAllRooms(0, 500);
        const normalized = searchValue.trim().toUpperCase();
        results = all.filter((environment) => {
          if (searchType === "name") {
            return environment.name.toUpperCase().includes(normalized);
          }
          if (searchType === "criticality") {
            return environment.criticality === normalized;
          }
          if (searchType === "type") {
            return environment.type === normalized;
          }
          return false;
        });
      }
      setEnvironments(results);
      setOpenSearchDialog(false);
      setSearchValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na pesquisa");
    } finally {
      setLoading(false);
    }
  };

  return {
    environments,
    loading,
    error,
    openSearchDialog,
    searchType,
    searchValue,
    currentPage,
    itemsPerPage,
    isAdmin,
    setError,
    setLoading,
    setSearchType,
    setSearchValue,
    setOpenSearchDialog,
    setEnvironments,
    loadEnvironments,
    handleDeleteEnvironment,
    handleSearch,
  };
}
