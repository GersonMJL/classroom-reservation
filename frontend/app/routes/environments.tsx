import {
    Button,
    Container,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { PageHeader, PageSection } from "~/ui";
import { EnvironmentFormDialog } from "~/routes/environments/environment-form-dialog";
import { EnvironmentsTable } from "~/routes/environments/environments-table";
import { SearchDialog } from "~/routes/environments/search-dialog";
import { useEnvironmentsManagement } from "~/routes/environments/use-environments-management";

export default function EnvironmentsManagement() {
    const {
        environments,
        loading,
        openEnvironmentDialog,
        openSearchDialog,
        searchType,
        searchValue,
        currentPage,
        itemsPerPage,
        isAdmin,
        isEditMode,
        formData,
        locations,
        loadingLocations,
        setSearchType,
        setSearchValue,
        setFormData,
        openCreateDialog,
        openEditDialog,
        closeEnvironmentDialog,
        setOpenSearchDialog,
        loadEnvironments,
        handleSaveEnvironment,
        handleDeleteEnvironment,
        handleSearch,
    } = useEnvironmentsManagement();

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <PageHeader
                title="Gestão de Ambientes"
                description="Cadastre, edite e pesquise ambientes disponíveis para reserva."
                actions={
                    <>
                        <Button
                            startIcon={<SearchIcon />}
                            variant="outlined"
                            onClick={() => setOpenSearchDialog(true)}
                        >
                            Buscar
                        </Button>
                        {isAdmin && (
                            <Button
                                startIcon={<AddIcon />}
                                variant="contained"
                                onClick={openCreateDialog}
                            >
                                Novo ambiente
                            </Button>
                        )}
                    </>
                }
            />

            <PageSection padded={false}>
                <EnvironmentsTable
                    environments={environments}
                    loading={loading}
                    isAdmin={isAdmin}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onEditEnvironment={openEditDialog}
                    onDeleteEnvironment={handleDeleteEnvironment}
                    onPageChange={loadEnvironments}
                    onOpenCreate={openCreateDialog}
                />
            </PageSection>

            <EnvironmentFormDialog
                open={openEnvironmentDialog}
                isEditMode={isEditMode}
                formData={formData}
                locations={locations}
                loadingLocations={loadingLocations}
                setFormData={setFormData}
                onClose={closeEnvironmentDialog}
                onSave={handleSaveEnvironment}
            />

            <SearchDialog
                open={openSearchDialog}
                searchType={searchType}
                searchValue={searchValue}
                onClose={() => setOpenSearchDialog(false)}
                onSearchTypeChange={setSearchType}
                onSearchValueChange={setSearchValue}
                onSearch={handleSearch}
            />
        </Container>
    );
}
