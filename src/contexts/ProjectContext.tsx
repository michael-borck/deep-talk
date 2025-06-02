import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Project, Transcript } from '../types';
import { generateId } from '../utils/helpers';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Project operations
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  
  // Transcript management
  addTranscriptToProject: (projectId: string, transcriptId: string) => Promise<void>;
  removeTranscriptFromProject: (projectId: string, transcriptId: string) => Promise<void>;
  getProjectTranscripts: (projectId: string) => Promise<Transcript[]>;
  
  // Analysis
  analyzeProject: (projectId: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await window.electronAPI.database.all(`
        SELECT 
          p.*,
          COUNT(DISTINCT pt.transcript_id) as transcript_count,
          SUM(t.duration) as total_duration,
          MIN(t.created_at) as earliest_transcript,
          MAX(t.created_at) as latest_transcript
        FROM projects p
        LEFT JOIN project_transcripts pt ON p.id = pt.project_id
        LEFT JOIN transcripts t ON pt.transcript_id = t.id
        GROUP BY p.id
        ORDER BY p.updated_at DESC
      `);
      
      const projectsWithMetadata = result.map((row: any) => ({
        ...row,
        themes: row.themes ? JSON.parse(row.themes) : [],
        key_insights: row.key_insights ? JSON.parse(row.key_insights) : [],
        tags: row.tags ? JSON.parse(row.tags) : [],
        date_range: row.earliest_transcript && row.latest_transcript ? {
          start: row.earliest_transcript,
          end: row.latest_transcript
        } : undefined
      }));
      
      setProjects(projectsWithMetadata);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Create a new project
  const createProject = async (name: string, description?: string): Promise<Project> => {
    try {
      const project: Project = {
        id: generateId(),
        name,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        themes: [],
        key_insights: [],
        tags: [],
        color: '#667eea', // Default purple
        icon: '📁'
      };
      
      await window.electronAPI.database.run(
        `INSERT INTO projects (id, name, description, created_at, updated_at, themes, key_insights, tags, color, icon)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id,
          project.name,
          project.description || null,
          project.created_at,
          project.updated_at,
          JSON.stringify(project.themes),
          JSON.stringify(project.key_insights),
          JSON.stringify(project.tags),
          project.color,
          project.icon
        ]
      );
      
      await loadProjects();
      return project;
    } catch (err) {
      console.error('Failed to create project:', err);
      throw new Error('Failed to create project');
    }
  };

  // Update a project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updateFields = [];
      const updateValues = [];
      
      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }
      if (updates.themes !== undefined) {
        updateFields.push('themes = ?');
        updateValues.push(JSON.stringify(updates.themes));
      }
      if (updates.key_insights !== undefined) {
        updateFields.push('key_insights = ?');
        updateValues.push(JSON.stringify(updates.key_insights));
      }
      if (updates.summary !== undefined) {
        updateFields.push('summary = ?');
        updateValues.push(updates.summary);
      }
      if (updates.tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(JSON.stringify(updates.tags));
      }
      if (updates.color !== undefined) {
        updateFields.push('color = ?');
        updateValues.push(updates.color);
      }
      if (updates.icon !== undefined) {
        updateFields.push('icon = ?');
        updateValues.push(updates.icon);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(id);
        await window.electronAPI.database.run(
          `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
        
        await loadProjects();
        
        // Update current project if it's the one being updated
        if (currentProject?.id === id) {
          await loadProject(id);
        }
      }
    } catch (err) {
      console.error('Failed to update project:', err);
      throw new Error('Failed to update project');
    }
  };

  // Delete a project
  const deleteProject = async (id: string) => {
    try {
      await window.electronAPI.database.run('DELETE FROM projects WHERE id = ?', [id]);
      await loadProjects();
      
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
      throw new Error('Failed to delete project');
    }
  };

  // Load a specific project
  const loadProject = async (id: string) => {
    try {
      const project = await window.electronAPI.database.get(`
        SELECT 
          p.*,
          COUNT(DISTINCT pt.transcript_id) as transcript_count,
          SUM(t.duration) as total_duration,
          MIN(t.created_at) as earliest_transcript,
          MAX(t.created_at) as latest_transcript
        FROM projects p
        LEFT JOIN project_transcripts pt ON p.id = pt.project_id
        LEFT JOIN transcripts t ON pt.transcript_id = t.id
        WHERE p.id = ?
        GROUP BY p.id
      `, [id]);
      
      if (project) {
        const projectWithMetadata = {
          ...project,
          themes: project.themes ? JSON.parse(project.themes) : [],
          key_insights: project.key_insights ? JSON.parse(project.key_insights) : [],
          tags: project.tags ? JSON.parse(project.tags) : [],
          date_range: project.earliest_transcript && project.latest_transcript ? {
            start: project.earliest_transcript,
            end: project.latest_transcript
          } : undefined
        };
        
        setCurrentProject(projectWithMetadata);
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      throw new Error('Failed to load project');
    }
  };

  // Add transcript to project
  const addTranscriptToProject = async (projectId: string, transcriptId: string) => {
    try {
      await window.electronAPI.database.run(
        'INSERT OR IGNORE INTO project_transcripts (project_id, transcript_id) VALUES (?, ?)',
        [projectId, transcriptId]
      );
      
      // Refresh project data
      if (currentProject?.id === projectId) {
        await loadProject(projectId);
      }
      await loadProjects();
    } catch (err) {
      console.error('Failed to add transcript to project:', err);
      throw new Error('Failed to add transcript to project');
    }
  };

  // Remove transcript from project
  const removeTranscriptFromProject = async (projectId: string, transcriptId: string) => {
    try {
      await window.electronAPI.database.run(
        'DELETE FROM project_transcripts WHERE project_id = ? AND transcript_id = ?',
        [projectId, transcriptId]
      );
      
      // Refresh project data
      if (currentProject?.id === projectId) {
        await loadProject(projectId);
      }
      await loadProjects();
    } catch (err) {
      console.error('Failed to remove transcript from project:', err);
      throw new Error('Failed to remove transcript from project');
    }
  };

  // Get all transcripts for a project
  const getProjectTranscripts = async (projectId: string): Promise<Transcript[]> => {
    try {
      const result = await window.electronAPI.database.all(`
        SELECT t.*, pt.added_at
        FROM transcripts t
        JOIN project_transcripts pt ON t.id = pt.transcript_id
        WHERE pt.project_id = ?
        ORDER BY pt.added_at DESC
      `, [projectId]);
      
      return result.map((row: any) => ({
        ...row,
        action_items: row.action_items ? JSON.parse(row.action_items) : [],
        key_topics: row.key_topics ? JSON.parse(row.key_topics) : [],
        tags: row.tags ? JSON.parse(row.tags) : []
      }));
    } catch (err) {
      console.error('Failed to get project transcripts:', err);
      throw new Error('Failed to get project transcripts');
    }
  };

  // Analyze project (placeholder for AI analysis)
  const analyzeProject = async (projectId: string) => {
    try {
      // TODO: Implement actual AI analysis
      // For now, just update the last_analysis_at timestamp
      await window.electronAPI.database.run(
        'UPDATE projects SET last_analysis_at = ? WHERE id = ?',
        [new Date().toISOString(), projectId]
      );
      
      // In a real implementation, this would:
      // 1. Get all transcripts for the project
      // 2. Send them to the AI service for cross-transcript analysis
      // 3. Update the project with themes, insights, summary
      // 4. Store detailed analysis results in project_analysis table
      
      await loadProject(projectId);
      await loadProjects();
    } catch (err) {
      console.error('Failed to analyze project:', err);
      throw new Error('Failed to analyze project');
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      isLoading,
      error,
      createProject,
      updateProject,
      deleteProject,
      loadProject,
      addTranscriptToProject,
      removeTranscriptFromProject,
      getProjectTranscripts,
      analyzeProject,
      refreshProjects: loadProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
};