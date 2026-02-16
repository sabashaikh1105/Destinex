import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save, Trash, Edit, Check, X, Pencil, ClipboardList } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { getTripById, updateTrip } from '@/service/backendApi';

const TravelNotes = ({ trip }) => {
  const LOCAL_TRIPS_KEY = 'destinex.localTrips';
  const tripId = trip?.id;
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const localNotesKey = tripId ? `destinex.travelNotes.${tripId}` : null;

  const isOfflineApiError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return (
      message.includes('offline') ||
      message.includes('offline') ||
      message.includes('network')
    );
  };

  const isNotFoundApiError = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('trip not found') || message.includes('404');
  };

  const readLocalNotes = () => {
    if (!localNotesKey) return [];
    try {
      const raw = localStorage.getItem(localNotesKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeLocalNotes = (nextNotes) => {
    if (!localNotesKey) return;
    try {
      localStorage.setItem(localNotesKey, JSON.stringify(nextNotes));
    } catch {
      // No-op: local cache write failures should not block UI edits.
    }
  };

  const readLocalTripNotes = () => {
    if (!tripId) return [];
    try {
      const raw = localStorage.getItem(LOCAL_TRIPS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      const localTrip = parsed.find((item) => item?.id === tripId);
      return Array.isArray(localTrip?.travelNotes) ? localTrip.travelNotes : [];
    } catch {
      return [];
    }
  };

  // Load notes when component mounts
  useEffect(() => {
    if (tripId) {
      loadNotes();
    }
  }, [tripId]);

  // Load notes from backend Mongo API
  const loadNotes = async () => {
    setLoading(true);
    const cachedNotes = readLocalNotes();
    const localTripNotes = readLocalTripNotes();
    const fallbackNotes = cachedNotes.length > 0 ? cachedNotes : localTripNotes;
    if (fallbackNotes.length > 0) setNotes(fallbackNotes);

    try {
      if (!navigator.onLine) {
        setOfflineMode(true);
        setNotes(fallbackNotes);
        return;
      }

      const tripData = await getTripById(tripId);
      if (tripData) {
        if (tripData.travelNotes) {
          setNotes(tripData.travelNotes);
          writeLocalNotes(tripData.travelNotes);
        } else {
          setNotes([]);
          writeLocalNotes([]);
        }
      }
      setOfflineMode(false);
    } catch (error) {
      console.error('Error loading notes:', error);
      if (isOfflineApiError(error) || !navigator.onLine) {
        setOfflineMode(true);
        setNotes(fallbackNotes);
      } else if (isNotFoundApiError(error)) {
        // Trip may exist locally but is not synced yet.
        setOfflineMode(true);
        setNotes(fallbackNotes);
      } else {
        toast.error('Failed to load your travel notes');
      }
    } finally {
      setLoading(false);
    }
  };

  // Save notes to backend API (with local-first fallback)
  const persistNotes = async (updatedNotes, { showSuccessToast = false } = {}) => {
    if (!tripId) return;

    writeLocalNotes(updatedNotes);
    setSaving(true);

    if (!navigator.onLine) {
      setOfflineMode(true);
      setSaving(false);
      if (showSuccessToast) {
        toast.success('Saved locally. Will sync when online.');
      }
      return;
    }

    try {
      await updateTrip(tripId, { travelNotes: updatedNotes });

      setOfflineMode(false);
      if (showSuccessToast) {
        toast.success('Your travel notes have been saved');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      if (isOfflineApiError(error) || !navigator.onLine) {
        setOfflineMode(true);
        if (showSuccessToast) {
          toast.success('Saved locally. Will sync when online.');
        }
      } else if (isNotFoundApiError(error)) {
        // Backend has not synced this trip yet; keep local persistence only.
        setOfflineMode(true);
        if (showSuccessToast) {
          toast.success('Saved locally. Will sync when trip is synced.');
        }
      } else if (showSuccessToast) {
        toast.error('Failed to save your travel notes');
      }
    } finally {
      setSaving(false);
    }
  };

  // Add a new note
  const addNote = () => {
    if (!newNote.trim()) return;
    
    const noteItem = {
      id: Date.now().toString(),
      text: newNote.trim(),
      completed: false,
      isChecklist: false,
      createdAt: new Date().toISOString()
    };
    
    const updatedNotes = [...notes, noteItem];
    setNotes(updatedNotes);
    setNewNote('');
    
    // Auto-save
    persistNotes(updatedNotes);
  };

  // Toggle note completion
  const toggleNoteCompleted = (index) => {
    const updatedNotes = [...notes];
    updatedNotes[index].completed = !updatedNotes[index].completed;
    setNotes(updatedNotes);
    
    // Auto-save
    persistNotes(updatedNotes);
  };

  // Toggle note type (regular note or checklist item)
  const toggleNoteType = (index) => {
    const updatedNotes = [...notes];
    updatedNotes[index].isChecklist = !updatedNotes[index].isChecklist;
    setNotes(updatedNotes);
    
    // Auto-save
    persistNotes(updatedNotes);
  };

  // Delete a note
  const deleteNote = (index) => {
    const updatedNotes = [...notes];
    updatedNotes.splice(index, 1);
    setNotes(updatedNotes);
    
    // Auto-save
    persistNotes(updatedNotes);
  };

  // Start editing a note
  const startEditNote = (index) => {
    setEditingIndex(index);
    setEditText(notes[index].text);
  };

  // Save edited note
  const saveEditedNote = () => {
    if (editingIndex === -1 || !editText.trim()) return;
    
    const updatedNotes = [...notes];
    updatedNotes[editingIndex].text = editText.trim();
    setNotes(updatedNotes);
    setEditingIndex(-1);
    
    // Auto-save
    persistNotes(updatedNotes);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingIndex(-1);
  };

  // Handle key press for adding and editing notes
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (action === 'add') {
        addNote();
      } else if (action === 'edit') {
        saveEditedNote();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2 rounded-xl">
          <ClipboardList className="text-indigo-600 text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Travel Notes & Checklist</h2>
          {offlineMode && (
            <p className="text-sm text-amber-700">Offline mode: notes are being saved locally.</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Add new note */}
          <div className="mb-6">
            <div className="flex gap-3">
              <Textarea 
                placeholder="Add a note or checklist item..." 
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, 'add')}
                className="flex-grow min-h-[80px] resize-none"
              />
              <Button 
                onClick={addNote} 
                disabled={!newNote.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {/* Notes list */}
          {notes.length > 0 ? (
            <div className="space-y-3 mb-6">
              {notes.map((note, index) => (
                <motion.div 
                  key={note.id} 
                  className={`p-4 rounded-lg border ${note.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {editingIndex === index ? (
                    <div className="flex flex-col gap-2">
                      <Textarea 
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, 'edit')}
                        className="w-full min-h-[80px] resize-none"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={saveEditedNote}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      {note.isChecklist && (
                        <Checkbox 
                          checked={note.completed}
                          onCheckedChange={() => toggleNoteCompleted(index)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-grow">
                        <p className={`text-gray-800 ${note.completed && note.isChecklist ? 'line-through text-gray-500' : ''}`}>
                          {note.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleNoteType(index)}
                          className="p-1 rounded hover:bg-gray-100"
                          title={note.isChecklist ? "Convert to note" : "Convert to checklist item"}
                        >
                          {note.isChecklist ? (
                            <Pencil className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Check className="h-4 w-4 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => startEditNote(index)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => deleteNote(index)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <Trash className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="mb-1">No notes yet</p>
              <p className="text-sm">Add important reminders for your trip</p>
            </div>
          )}

          {/* Auto-save indicator */}
          <div className="text-sm text-gray-500 italic flex justify-end">
            {saving ? 'Saving...' : offlineMode ? 'Saved locally (offline)' : 'All changes automatically saved'}
          </div>
        </>
      )}
    </div>
  );
};

export default TravelNotes; 
