import {
    Box,
    Button,
    Container,
    Alert,
    Stack,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { EnvironmentFormDialog } from "~/routes/environments/environment-form-dialog";
import { EnvironmentsTable } from "~/routes/environments/environments-table";
import { SearchDialog } from "~/routes/environments/search-dialog";
import { useEnvironmentsManagement } from "~/routes/environments/use-environments-management";

export default function EnvironmentsManagement() {
    const {
        environments,
        loading,
        error,
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
        setError,
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
            <Box sx={{ mb: 3 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 700, mb: 2 }}
                >
                    Gestão de Ambientes
                </Typography>

                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError("")}
                        sx={{ mb: 2 }}
                    >
                        {error}
                    </Alert>
                )}

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    {isAdmin && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={openCreateDialog}
                        >
                            Novo Ambiente
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<SearchIcon />}
                        onClick={() => setOpenSearchDialog(true)}
                    >
                        Pesquisar
                    </Button>
                </Stack>

                <EnvironmentsTable
                    environments={environments}
                    loading={loading}
                    isAdmin={isAdmin}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    onEditEnvironment={openEditDialog}
                    onDeleteEnvironment={handleDeleteEnvironment}
                    onPageChange={loadEnvironments}
                />
            </Box>

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
