import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  purposeApi,
  resourceApi,
  roomApi,
} from "../../services/api";
import type {
  Purpose,
  Resource,
  Room,
} from "../../services/api";
import type { RoomSearchType } from "./types";

export function useRoomsData() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [openSearchDialog, setOpenSearchDialog] = useState(false);
  const [searchType, setSearchType] = useState<RoomSearchType>("capacity");
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

  const loadRooms = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const skip = (page - 1) * itemsPerPage;
      const data = await roomApi.getAllRooms(skip, itemsPerPage);
      setRooms(data);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar ambientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    const loadPurposes = async () => {
      try {
        const data = await purposeApi.getAllPurposes(0, 200, true);
        setPurposes(data);
      } catch {
        setPurposes([]);
      }
    };
    loadPurposes();
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const data = await resourceApi.getAllResources(0, 200, true);
        setResources(data);
      } catch {
        setResources([]);
      }
    };
    loadResources();
  }, []);

  const handleDeleteRoom = async (roomId: number) => {
    if (window.confirm("Tem certeza de que deseja excluir este ambiente?")) {
      setLoading(true);
      try {
        await roomApi.deleteRoom(roomId);
        loadRooms();
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
      let results;
      if (searchType === "capacity") {
        const capacity = parseInt(searchValue, 10);
        if (isNaN(capacity) || capacity <= 0) {
          setError("Informe um número de capacidade válido");
          return;
        }
        results = await roomApi.searchByCapacity(capacity);
      } else {
        results = await roomApi.searchByLocation(searchValue);
      }
      setRooms(results);
      setOpenSearchDialog(false);
      setSearchValue("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na pesquisa");
    } finally {
      setLoading(false);
    }
  };

  return {
    rooms,
    purposes,
    resources,
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
    setPurposes,
    setSearchType,
    setSearchValue,
    setOpenSearchDialog,
    setRooms,
    loadRooms,
    handleDeleteRoom,
    handleSearch,
  };
}
