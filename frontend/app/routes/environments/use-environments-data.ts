import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { environmentApi, hasValidAccessToken } from "../../services/api";
import type { Environment } from "../../services/api";
import { useToast } from "../../ui/useToast";
import type { EnvironmentSearchType } from "./types";

export function useEnvironmentsData() {
  const navigate = useNavigate();
  const toast = useToast();
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
        if (!hasValidAccessToken()) {
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
      const msg = err instanceof Error ? err.message : "Falha ao carregar ambientes";
      toast.error(msg);
      setError(msg);
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
        toast.success("Ambiente excluído.");
        await loadEnvironments();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha ao excluir ambiente";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      const msg = "Informe um valor para pesquisa";
      toast.error(msg);
      setError(msg);
      return;
    }

    setLoading(true);
    try {
      let results: Environment[] = [];
      if (searchType === "capacity") {
        const capacity = parseInt(searchValue, 10);
        if (isNaN(capacity) || capacity <= 0) {
          const msg = "Informe um número de capacidade válido";
          toast.error(msg);
          setError(msg);
          return;
        }
        results = await environmentApi.searchByCapacity(capacity);
      } else if (searchType === "location_id") {
        const locationId = parseInt(searchValue, 10);
        if (isNaN(locationId) || locationId <= 0) {
          const msg = "Informe um ID de localizacao valido";
          toast.error(msg);
          setError(msg);
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
      const msg = err instanceof Error ? err.message : "Falha na pesquisa";
      toast.error(msg);
      setError(msg);
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
