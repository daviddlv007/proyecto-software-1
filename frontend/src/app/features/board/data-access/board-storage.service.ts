import { Injectable } from '@angular/core';
import { supabase } from '../supabase.client';
import { BoardDiagram } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardStorageService {
  private pollingInterval: any = null;
  private lastData: string = '';
  private configPollingInterval: any = null;
  private lastConfig: string = '';

  async loadDiagram(): Promise<BoardDiagram | null> {
    try {
      const { data, error } = await supabase
        .from('diagrams')
        .select('data, updated_at')
        .eq('id', 'main')
        .single();

      if (error) {
        console.error('Error loading diagram:', error);
        return null;
      }
      return data?.data as BoardDiagram;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }

  async saveDiagram(diagram: BoardDiagram) {
  try {
    const { error } = await supabase
      .from('diagrams')
      .upsert({ id: 'main', data: diagram, updated_at: new Date().toISOString() });

    if (error) console.error('Error saving diagram:', error);
  } catch (error) {
    console.error('Error:', error);
  }
}


  startPolling(callback: (diagram: BoardDiagram) => void, interval: number = 2000) {
    this.stopPolling();
    
    this.pollingInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('diagrams')
          .select('data, updated_at')
          .eq('id', 'main')
          .single();

        if (!error && data) {
          const currentData = JSON.stringify(data.data);
          // Solo llamar al callback si los datos cambiaron
          if (currentData !== this.lastData) {
            this.lastData = currentData;
            callback(data.data as BoardDiagram);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

    // Nuevos métodos para el control de habilitación
  async loadBoardConfig(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('board_config')
        .select('enabled, updated_at')
        .eq('id', 'main')
        .single();

      if (error) {
        // Si no existe la configuración, crearla por defecto como habilitada
        if (error.code === 'PGRST116') {
          await this.saveBoardConfig(true);
          return true;
        }
        console.error('Error loading board config:', error);
        return true; // Por defecto habilitado
      }
      return data?.enabled ?? true;
    } catch (error) {
      console.error('Error:', error);
      return true;
    }
  }

  async saveBoardConfig(enabled: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('board_config')
        .upsert({ 
          id: 'main', 
          enabled, 
          updated_at: new Date().toISOString() 
        });

      if (error) console.error('Error saving board config:', error);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  startConfigPolling(callback: (enabled: boolean) => void, interval: number = 2000) {
    this.stopConfigPolling();
    
    this.configPollingInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('board_config')
          .select('enabled, updated_at')
          .eq('id', 'main')
          .single();

        if (!error && data) {
          const currentConfig = JSON.stringify(data.enabled);
          if (currentConfig !== this.lastConfig) {
            this.lastConfig = currentConfig;
            callback(data.enabled);
          }
        }
      } catch (error) {
        console.error('Config polling error:', error);
      }
    }, interval);
  }

  stopConfigPolling() {
    if (this.configPollingInterval) {
      clearInterval(this.configPollingInterval);
      this.configPollingInterval = null;
    }
  }

  ngOnDestroy() {
    this.stopPolling();
    this.stopConfigPolling();
  }
}