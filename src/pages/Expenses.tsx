import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Button,
  TextField,
  Modal,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Close, Delete, Edit } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

type Expense = {
  id: number;
  description: string;
  amount: number;
  expense_date: string;
  image_url: string | null;
};

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    image: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // editingExpense: null ise yeni ekleme, dolu ise düzenleme modunda
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { profile } = useAuth();

  // Mobil uyum için
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses(expenses, selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, expenses]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Harcama verileri alınırken hata oluştu:', error);
    } else {
      setExpenses(data);
      filterExpenses(data, selectedMonth, selectedYear);
    }
  };

  const filterExpenses = (expenses: Expense[], month: number, year: number) => {
    const filtered = expenses.filter(expense => {
      const date = new Date(expense.expense_date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });
    setFilteredExpenses(filtered);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newExpense.description || !newExpense.amount || !newExpense.expense_date) {
      alert('Tüm alanlar doldurulmalıdır!');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = '';

      // Düzenleme modunda, mevcut image_url değerini kullanıyoruz
      if (editingExpense) {
        imageUrl = editingExpense.image_url || '';
      }

      // Yeni resim seçildiyse yükle
      if (newExpense.image) {
        const fileName = newExpense.image.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `expenses/${Date.now()}-${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('expense-images')
          .upload(filePath, newExpense.image);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('expense-images')
          .getPublicUrl(filePath);
        imageUrl = publicUrlData.publicUrl;
      }

      if (editingExpense) {
        // Düzenleme işlemi
        const { error } = await supabase
          .from('expenses')
          .update([
            {
              description: newExpense.description,
              amount: parseFloat(newExpense.amount),
              expense_date: newExpense.expense_date,
              image_url: imageUrl,
            },
          ])
          .eq('id', editingExpense.id);

        if (error) throw error;
      } else {
        // Yeni harcama ekleme
        const { error } = await supabase.from('expenses').insert([
          {
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            expense_date: newExpense.expense_date,
            image_url: imageUrl,
          },
        ]);

        if (error) throw error;
      }

      await fetchExpenses();
      handleModalClose();
    } catch (error) {
      console.error('Harcama kaydedilirken hata oluştu:', error);
      alert('Bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingExpense(null);
    setNewExpense({
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      image: null,
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpense({
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      image: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (expenseId: number) => {
    if (!window.confirm('Bu harcamayı silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) {
      console.error('Harcama silinirken hata oluştu:', error);
      alert('Silme işlemi başarısız!');
    } else {
      await fetchExpenses();
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Harcama Listesi
      </Typography>
      {profile?.is_admin && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowModal(true)}
          style={{ marginBottom: '20px' }}
        >
          Harcama Ekle
        </Button>
      )}

      <FormControl fullWidth style={{ marginBottom: '20px' }}>
        <InputLabel id="month-select-label">Ay</InputLabel>
        <Select
          labelId="month-select-label"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          label="Ay"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
            <MenuItem key={month} value={month}>
              {month}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth style={{ marginBottom: '20px' }}>
        <InputLabel id="year-select-label">Yıl</InputLabel>
        <Select
          labelId="year-select-label"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          label="Yıl"
        >
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell>Açıklama</TableCell>
              <TableCell>Tutar</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell>Resim</TableCell>
              {profile?.is_admin && <TableCell>İşlemler</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.amount} TL</TableCell>
                <TableCell>{expense.expense_date}</TableCell>
                <TableCell>
                  {expense.image_url && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => setSelectedImage(expense.image_url!)}
                    >
                      Resmi Göster
                    </Button>
                  )}
                </TableCell>
                {profile?.is_admin && (
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(expense)}
                      size={isMobile ? 'small' : 'medium'}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="secondary"
                      onClick={() => handleDelete(expense.id)}
                      size={isMobile ? 'small' : 'medium'}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Ekle/Düzenle Modal */}
      <Modal open={showModal} onClose={handleModalClose}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {editingExpense ? 'Harcama Düzenle' : 'Harcama Ekle'}
          </Typography>
          <form onSubmit={handleExpenseSubmit}>
            <TextField
              fullWidth
              label="Açıklama"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              style={{ marginBottom: '10px' }}
            />
            <TextField
              fullWidth
              label="Tutar"
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              style={{ marginBottom: '10px' }}
            />
            <TextField
              fullWidth
              label="Tarih"
              type="date"
              value={newExpense.expense_date}
              onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
              style={{ marginBottom: '10px' }}
              InputLabelProps={{
                shrink: true,
              }}
            />
            <Button variant="contained" component="label" fullWidth style={{ marginBottom: '20px' }}>
              {newExpense.image ? 'Resim Yüklendi' : 'Resim Yükle'}
              <input
                type="file"
                hidden
                onChange={(e) =>
                  setNewExpense({ ...newExpense, image: e.target.files ? e.target.files[0] : null })
                }
              />
            </Button>
            <Button variant="contained" color="primary" fullWidth type="submit" disabled={loading}>
              {loading ? 'Yükleniyor...' : editingExpense ? 'Güncelle' : 'Harcama Ekle'}
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Resim Gösterme Dialog'u */}
      <Dialog open={!!selectedImage} onClose={() => setSelectedImage(null)} maxWidth="md">
        <DialogContent>
          <IconButton
            aria-label="close"
            onClick={() => setSelectedImage(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
          {selectedImage && <img src={selectedImage} alt="Harcama Resmi" style={{ width: '100%', height: 'auto' }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
