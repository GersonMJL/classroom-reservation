import { Box, Button, Container, Alert, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { RoomFormDialog } from "./rooms/room-form-dialog";
import { RoomsTable } from "./rooms/rooms-table";
import { SearchDialog } from "./rooms/search-dialog";
import { useRoomsManagement } from "~/routes/rooms/use-rooms-management";

export default function RoomsManagement() {
  const {
    rooms,
    purposes,
    resources,
    loading,
    error,
    openRoomDialog,
    openSearchDialog,
    searchType,
    searchValue,
    currentPage,
    itemsPerPage,
    isAdmin,
    isEditMode,
    formData,
    purposeInput,
    selectedPurpose,
    fixedResourceId,
    optionalResourceId,
    fixedResourceQty,
    optionalResourceQty,
    typeAttributeFields,
    setError,
    setSearchType,
    setSearchValue,
    setPurposeInput,
    setSelectedPurpose,
    setFixedResourceId,
    setOptionalResourceId,
    setFixedResourceQty,
    setOptionalResourceQty,
    setFormData,
    openCreateDialog,
    openEditDialog,
    closeRoomDialog,
    setOpenSearchDialog,
    loadRooms,
    handleSaveRoom,
    handleDeleteRoom,
    handleAddPurpose,
    handleCreatePurpose,
    handleRemovePurpose,
    handleSearch,
    addFixedResource,
    addOptionalResource,
    addTypeAttributeField,
    updateTypeAttributeField,
    removeTypeAttributeField,
    removeResourceAssignment,
    getResourceLabel,
  } = useRoomsManagement();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          Gestão de Ambientes
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
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

        <RoomsTable
          rooms={rooms}
          loading={loading}
          isAdmin={isAdmin}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onEditRoom={openEditDialog}
          onDeleteRoom={handleDeleteRoom}
          onPageChange={loadRooms}
        />
      </Box>

      <RoomFormDialog
        open={openRoomDialog}
        isEditMode={isEditMode}
        formData={formData}
        purposes={purposes}
        resources={resources}
        purposeInput={purposeInput}
        selectedPurpose={selectedPurpose}
        fixedResourceId={fixedResourceId}
        optionalResourceId={optionalResourceId}
        fixedResourceQty={fixedResourceQty}
        optionalResourceQty={optionalResourceQty}
        typeAttributeFields={typeAttributeFields}
        setFormData={setFormData}
        setPurposeInput={setPurposeInput}
        setSelectedPurpose={setSelectedPurpose}
        setFixedResourceId={setFixedResourceId}
        setOptionalResourceId={setOptionalResourceId}
        setFixedResourceQty={setFixedResourceQty}
        setOptionalResourceQty={setOptionalResourceQty}
        onClose={closeRoomDialog}
        onSave={handleSaveRoom}
        onAddPurpose={handleAddPurpose}
        onCreatePurpose={handleCreatePurpose}
        onRemovePurpose={handleRemovePurpose}
        onAddFixedResource={addFixedResource}
        onAddOptionalResource={addOptionalResource}
        onRemoveResourceAssignment={removeResourceAssignment}
        onAddTypeAttributeField={addTypeAttributeField}
        onUpdateTypeAttributeField={updateTypeAttributeField}
        onRemoveTypeAttributeField={removeTypeAttributeField}
        getResourceLabel={getResourceLabel}
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
