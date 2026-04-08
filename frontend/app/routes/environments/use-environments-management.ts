import { useEnvironmentForm } from "./use-environment-form";
import { useEnvironmentsData } from "./use-environments-data";

export function useEnvironmentsManagement() {
  const data = useEnvironmentsData();
  const form = useEnvironmentForm({
    setLoading: data.setLoading,
    setError: data.setError,
    loadEnvironments: data.loadEnvironments,
  });

  return {
    environments: data.environments,
    loading: data.loading,
    error: data.error,
    openEnvironmentDialog: form.openEnvironmentDialog,
    openSearchDialog: data.openSearchDialog,
    searchType: data.searchType,
    searchValue: data.searchValue,
    currentPage: data.currentPage,
    itemsPerPage: data.itemsPerPage,
    isAdmin: data.isAdmin,
    isEditMode: form.isEditMode,
    formData: form.formData,
    setError: data.setError,
    setSearchType: data.setSearchType,
    setSearchValue: data.setSearchValue,
    setFormData: form.setFormData,
    openCreateDialog: form.openCreateDialog,
    openEditDialog: form.openEditDialog,
    closeEnvironmentDialog: form.closeEnvironmentDialog,
    setOpenSearchDialog: data.setOpenSearchDialog,
    loadEnvironments: data.loadEnvironments,
    handleSaveEnvironment: form.handleSaveEnvironment,
    handleDeleteEnvironment: data.handleDeleteEnvironment,
    handleSearch: data.handleSearch,
  };
}
