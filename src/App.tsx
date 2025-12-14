import { useState, useEffect, useRef } from 'react'
import './App.css'
import { CharacterList } from './components/CharacterList';
import { CharacterEditDialog } from './components/CharacterEditDialog';
import { RelicReverseLookup } from './components/RelicReverseLookup';
import { Settings } from './components/Settings';
import type { CharacterFilter, RelicSet } from './types';

type View = 'filter' | 'reverse' | 'settings';

// 初回実行時のダミーデータ
const initialCharacters: CharacterFilter[] = [
  {
    id: '1',
    characterName: '丹恒・飲月',
    updatedAt: Date.now(),
    targetRelicSets: ['Musketeer', 'Wastelander'],
    targetPlanarSets: ['Rutilant'],
    mainStats: {
      body: ['CritRate', 'CritDMG'],
      feet: ['Attack', 'Speed'],
      planarSphere: ['ImaginaryDMG', 'Attack'],
      linkRope: ['Attack', 'EnergyRegenRate']
    },
    subStats: ['CritRate', 'CritDMG', 'Attack', 'Speed']
  }
];

function App() {
  const [currentView, setCurrentView] = useState<View>('filter');
  const [characters, setCharacters] = useState<CharacterFilter[]>(initialCharacters);

  // 遺物データの状態
  const [relicSets, setRelicSets] = useState<RelicSet[]>([]);
  const [planarSets, setPlanarSets] = useState<RelicSet[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CharacterFilter | undefined>(undefined);
  const [highlightedCharacterId, setHighlightedCharacterId] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  // マウント時にデータを読み込む
  useEffect(() => {
    const loadData = async () => {
      try {
        // キャラクターの読み込み
        const charResult = await window.electron.loadData();
        if (charResult.success && charResult.data) {
          const parsed = JSON.parse(charResult.data);
          if (Array.isArray(parsed)) {
            setCharacters(parsed);
          }
        }

        // 遺物の読み込み
        const relicResult = await window.electron.loadRelics();
        if (relicResult.success && relicResult.data) {
          const parsed = JSON.parse(relicResult.data);
          if (parsed.relicSets && Array.isArray(parsed.relicSets)) {
            setRelicSets(parsed.relicSets);
          }
          if (parsed.planarSets && Array.isArray(parsed.planarSets)) {
            setPlanarSets(parsed.planarSets);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  // 変更時にキャラクターデータを保存（デバウンス）
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isLoaded) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await window.electron.saveData(JSON.stringify(characters, null, 2));
      } catch (error) {
        console.error('Failed to save character data:', error);
      }
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [characters, isLoaded]);

  // 変更時に遺物データを保存（デバウンス）
  const saveRelicTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isLoaded) return;

    if (saveRelicTimeoutRef.current) {
      clearTimeout(saveRelicTimeoutRef.current);
    }

    saveRelicTimeoutRef.current = setTimeout(async () => {
      try {
        const dataToSave = { relicSets, planarSets };
        await window.electron.saveRelics(JSON.stringify(dataToSave, null, 2));
      } catch (error) {
        console.error('Failed to save relic data:', error);
      }
    }, 1000);

    return () => {
      if (saveRelicTimeoutRef.current) {
        clearTimeout(saveRelicTimeoutRef.current);
      }
    };
  }, [relicSets, planarSets, isLoaded]);

  const handleAddCharacter = () => {
    setEditingCharacter(undefined);
    setIsDialogOpen(true);
  };

  const handleEditCharacter = (id: string) => {
    const char = characters.find(c => c.id === id);
    if (char) {
      setEditingCharacter(char);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteCharacter = (id: string | string[]) => {
    if (confirm('本当に削除しますか？')) {
      if (Array.isArray(id)) {
        setCharacters(prev => prev.filter(c => !id.includes(c.id)));
      } else {
        setCharacters(prev => prev.filter(c => c.id !== id));
      }
    }
  };

  const handleSaveCharacter = (data: Omit<CharacterFilter, 'id' | 'updatedAt'>) => {
    if (editingCharacter) {
      // Update existing
      setCharacters(prev => prev.map(c =>
        c.id === editingCharacter.id
          ? { ...data, id: c.id, updatedAt: Date.now() }
          : c
      ));
    } else {
      // Add new
      const newChar: CharacterFilter = {
        ...data,
        id: crypto.randomUUID(),
        updatedAt: Date.now()
      };
      setCharacters(prev => [...prev, newChar]);
    }
  };

  const handleNavigateToCharacter = (charId: string) => {
    setHighlightedCharacterId(charId);
    setCurrentView('filter');
    setTimeout(() => setHighlightedCharacterId(undefined), 3000);
  };

  const handleAppendData = (data: CharacterFilter[]) => {
    setCharacters(prev => [...prev, ...data]);
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>HSR Relic Helper</h2>
        </div>
        <div className="nav-links-container">
          <ul className="nav-links">
            <li
              className={currentView === 'filter' ? 'active' : ''}
              onClick={() => setCurrentView('filter')}
            >
              キャラクター遺物管理
            </li>
            <li
              className={currentView === 'reverse' ? 'active' : ''}
              onClick={() => setCurrentView('reverse')}
            >
              遺物逆引き
            </li>
          </ul>
          <div className="nav-bottom">
            <div
              className={`settings-link ${currentView === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentView('settings')}
              title="設定"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">
        {currentView === 'filter' && (
          <div className="view-content">
            <CharacterList
              characters={characters}
              relicSets={relicSets}
              planarSets={planarSets}
              onAdd={handleAddCharacter}
              onEdit={handleEditCharacter}
              onDelete={handleDeleteCharacter}
              highlightedCharacterId={highlightedCharacterId}
              onImport={handleAppendData}
              onReorder={setCharacters}
            />
            <CharacterEditDialog
              isOpen={isDialogOpen}
              initialData={editingCharacter}
              onClose={() => setIsDialogOpen(false)}
              onSave={handleSaveCharacter}
              relicSets={relicSets}
              planarSets={planarSets}
            />
          </div>
        )}
        {currentView === 'reverse' && (
          <div className="view-content">
            <RelicReverseLookup
              characters={characters}
              onNavigateToCharacter={handleNavigateToCharacter}
              relicSets={relicSets}
              planarSets={planarSets}
            />
          </div>
        )}
        {currentView === 'settings' && (
          <div className="view-content">
            <Settings
              relicSets={relicSets}
              planarSets={planarSets}
              onUpdateRelics={setRelicSets}
              onUpdatePlanars={setPlanarSets}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
