import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { camerasApi } from '../../api/cameras/cameras.api';
import type { Camera } from '../../types/camera.types';
import type { CreateCameraRequest } from '../../api/cameras/cameras.types';

interface CameraFormData {
  name: string;
  location: string;
  region: string;
  sourceUrl: string;
  isActive: boolean;
  analysisIntervalSeconds: number;
  confidenceThreshold: number;
}

const EMPTY_FORM: CameraFormData = {
  name: '',
  location: '',
  region: '',
  sourceUrl: '',
  isActive: true,
  analysisIntervalSeconds: 2.5,
  confidenceThreshold: 0.45,
};

function validateForm(data: CameraFormData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (data.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
  if (data.location.trim().length < 2) errors.location = 'Location must be at least 2 characters.';
  if (!data.sourceUrl.trim()) errors.sourceUrl = 'Source file name is required.';
  if (data.analysisIntervalSeconds < 1 || data.analysisIntervalSeconds > 300) {
    errors.analysisIntervalSeconds = 'Interval must be between 1 and 300 seconds.';
  }
  if (data.confidenceThreshold < 0.1 || data.confidenceThreshold > 1.0) {
    errors.confidenceThreshold = 'Confidence must be between 0.10 and 1.00.';
  }
  return errors;
}

function ActiveChip({ isActive }: { isActive: boolean }) {
  return (
    <Chip
      label={isActive ? 'Active' : 'Inactive'}
      size="small"
      sx={{
        height: 20,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: isActive ? 'rgba(76,175,80,0.15)' : 'rgba(150,150,150,0.15)',
        color: isActive ? '#4caf50' : '#888',
        border: `1px solid ${isActive ? '#4caf5044' : '#88888844'}`,
      }}
    />
  );
}

export default function AdminCamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [formData, setFormData] = useState<CameraFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Camera | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCameras = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const res = await camerasApi.getAll();
      setCameras(res.data);
    } catch {
      setPageError('Failed to load cameras.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCameras();
  }, [loadCameras]);

  function openAddDialog() {
    setEditingCamera(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSaveError(null);
    setDialogOpen(true);
  }

  function openEditDialog(camera: Camera) {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      location: camera.location,
      region: camera.region ?? '',
      sourceUrl: camera.sourceUrl,
      isActive: camera.isActive,
      analysisIntervalSeconds: camera.analysisIntervalSeconds,
      confidenceThreshold: camera.confidenceThreshold,
    });
    setFormErrors({});
    setSaveError(null);
    setDialogOpen(true);
  }

  async function handleSave() {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setSaveError(null);

    const payload: CreateCameraRequest = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      region: formData.region.trim() || undefined,
      sourceUrl: formData.sourceUrl.trim(),
      isActive: formData.isActive,
      analysisIntervalSeconds: formData.analysisIntervalSeconds,
      confidenceThreshold: formData.confidenceThreshold,
    };

    try {
      if (editingCamera) {
        await camerasApi.update(editingCamera.id, payload);
      } else {
        await camerasApi.create(payload);
      }
      setDialogOpen(false);
      await loadCameras();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to save camera.';
      setSaveError(Array.isArray(msg) ? msg.join(' ') : String(msg));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(camera: Camera) {
    try {
      await camerasApi.update(camera.id, { isActive: !camera.isActive });
      await loadCameras();
    } catch {
      setPageError('Failed to update camera status.');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await camerasApi.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadCameras();
    } catch {
      setPageError('Failed to delete camera.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box>
      {}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Manage Cameras
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add, edit, and control camera sources for the detection worker.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          color="primary"
        >
          Add Camera
        </Button>
      </Box>

      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError(null)}>
          {pageError}
        </Alert>
      )}

      {}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: '1px solid rgba(46,125,50,0.2)' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', fontSize: 12 } }}>
                <TableCell>Name</TableCell>
                <TableCell>Location / Region</TableCell>
                <TableCell>Source File</TableCell>
                <TableCell align="center">Interval (s)</TableCell>
                <TableCell align="center">Confidence</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cameras.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No cameras yet. Click &quot;Add Camera&quot; to create one.
                  </TableCell>
                </TableRow>
              )}
              {cameras.map((cam) => (
                <TableRow
                  key={cam.id}
                  sx={{ '&:last-child td': { border: 0 }, opacity: cam.isActive ? 1 : 0.6 }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {cam.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{cam.location}</Typography>
                    {cam.region && (
                      <Typography variant="caption" color="text.secondary">
                        {cam.region}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {cam.sourceUrl}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{cam.analysisIntervalSeconds}s</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {(cam.confidenceThreshold * 100).toFixed(0)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <ActiveChip isActive={cam.isActive} />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      {}
                      <Tooltip title={cam.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(cam)}
                          sx={{ color: cam.isActive ? '#4caf50' : '#888' }}
                        >
                          <PowerSettingsNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {}
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(cam)}
                          sx={{ color: 'primary.light' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteTarget(cam)}
                          sx={{ color: '#f44336' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingCamera ? `Edit — ${editingCamera.name}` : 'Add New Camera'}
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Camera Name"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              error={!!formErrors.name}
              helperText={formErrors.name}
              fullWidth
              required
              size="small"
              placeholder="e.g. Tower Cam — North Ridge"
            />

            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
              error={!!formErrors.location}
              helperText={formErrors.location}
              fullWidth
              required
              size="small"
              placeholder="e.g. North Sector"
            />

            <TextField
              label="Region (optional)"
              value={formData.region}
              onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
              fullWidth
              size="small"
              placeholder="e.g. Zone A"
            />

            <TextField
              label="Source File"
              value={formData.sourceUrl}
              onChange={(e) => setFormData((p) => ({ ...p, sourceUrl: e.target.value }))}
              error={!!formErrors.sourceUrl}
              helperText={
                formErrors.sourceUrl ??
                'Filename inside the cameras/ folder — e.g. camera1.mp4'
              }
              fullWidth
              required
              size="small"
              placeholder="camera1.mp4"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Analysis Interval (seconds)"
                type="number"
                value={formData.analysisIntervalSeconds}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    analysisIntervalSeconds: parseFloat(e.target.value),
                  }))
                }
                error={!!formErrors.analysisIntervalSeconds}
                helperText={formErrors.analysisIntervalSeconds ?? '1 – 300 seconds'}
                size="small"
                slotProps={{ htmlInput: { min: 1, max: 300, step: 0.5 } }}
                sx={{ flex: 1 }}
              />

              <TextField
                label="Confidence Threshold"
                type="number"
                value={formData.confidenceThreshold}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    confidenceThreshold: parseFloat(e.target.value),
                  }))
                }
                error={!!formErrors.confidenceThreshold}
                helperText={formErrors.confidenceThreshold ?? '0.10 – 1.00'}
                size="small"
                slotProps={{ htmlInput: { min: 0.1, max: 1.0, step: 0.05 } }}
                sx={{ flex: 1 }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  {formData.isActive
                    ? 'Active — Python worker will process this camera'
                    : 'Inactive — Python worker will skip this camera'}
                </Typography>
              }
            />
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Saving…' : editingCamera ? 'Save Changes' : 'Add Camera'}
          </Button>
        </DialogActions>
      </Dialog>

      {}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Camera?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : undefined}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
