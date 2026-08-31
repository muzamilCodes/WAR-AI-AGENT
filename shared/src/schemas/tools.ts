import { z } from 'zod';

export const OpenApplicationSchema = z.object({
  name: z.string().min(1, 'Application name is required'),
  args: z.array(z.string()).optional()
});

export const CloseApplicationSchema = z.object({
  name: z.string().min(1, 'Application name is required'),
  force: z.boolean().optional().default(false)
});

export const RestartApplicationSchema = z.object({
  name: z.string().min(1, 'Application name is required')
});

export const FocusApplicationSchema = z.object({
  name: z.string().min(1, 'Application name is required')
});

export const OpenVSCodeSchema = z.object({
  path: z.string().optional(),
  newWindow: z.boolean().optional().default(false)
});

export const OpenVSCodeProjectSchema = z.object({
  path: z.string().min(1, 'Project path or name is required')
});

export const OpenVSCodeFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  line: z.number().optional()
});

export const OpenFolderSchema = z.object({
  path: z.string().min(1, 'Folder path is required')
});

export const CreateFolderSchema = z.object({
  path: z.string().min(1, 'Folder path is required')
});

export const RenameFolderSchema = z.object({
  source: z.string().min(1, 'Source path is required'),
  newName: z.string().min(1, 'New name is required')
});

export const MoveFolderSchema = z.object({
  source: z.string().min(1, 'Source path is required'),
  destination: z.string().min(1, 'Destination path is required')
});

export const CopyFolderSchema = z.object({
  source: z.string().min(1, 'Source path is required'),
  destination: z.string().min(1, 'Destination path is required')
});

export const SearchFolderSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  basePath: z.string().optional(),
  maxResults: z.number().optional().default(10)
});

export const ListFolderContentsSchema = z.object({
  path: z.string().min(1, 'Folder path is required'),
  depth: z.number().optional().default(1)
});

export const ProjectDiscoverySchema = z.object({
  name: z.string().min(1, 'Project name to search for is required'),
  searchLocations: z.array(z.string()).optional()
});

export const OpenFileSchema = z.object({
  path: z.string().min(1, 'File path is required')
});

export const ReadFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  maxLength: z.number().optional().default(20000)
});

export const CreateFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  content: z.string().default('')
});

export const EditFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  changes: z.string().min(1, 'File modification or content is required'),
  mode: z.enum(['append', 'overwrite', 'replace']).default('overwrite')
});

export const RenameFileSchema = z.object({
  path: z.string().min(1, 'File path is required'),
  newName: z.string().min(1, 'New name is required')
});

export const MoveFileSchema = z.object({
  source: z.string().min(1, 'Source path is required'),
  destination: z.string().min(1, 'Destination path is required')
});

export const CopyFileSchema = z.object({
  source: z.string().min(1, 'Source path is required'),
  destination: z.string().min(1, 'Destination path is required')
});

export const DeleteFileSchema = z.object({
  path: z.string().min(1, 'File path to delete is required'),
  permanent: z.boolean().optional().default(false)
});

export const OpenTerminalSchema = z.object({
  cwd: z.string().optional()
});

export const ExecuteCommandSchema = z.object({
  command: z.string().min(1, 'Command string is required'),
  cwd: z.string().optional(),
  timeoutMs: z.number().optional().default(30000),
  runInBackground: z.boolean().optional().default(false)
});

export const StopProcessSchema = z.object({
  pid: z.number().optional(),
  name: z.string().optional()
});

export const OpenBrowserSchema = z.object({
  url: z.string().optional()
});

export const NavigateBrowserSchema = z.object({
  url: z.string().min(1, 'URL is required')
});

export const SearchBrowserSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  engine: z.enum(['google', 'bing', 'duckduckgo']).default('google')
});

export const TypeTextSchema = z.object({
  text: z.string().min(1, 'Text to type is required')
});

export const PressKeySchema = z.object({
  key: z.string().min(1, 'Key name is required')
});

export const HotkeySchema = z.object({
  keys: z.array(z.string()).min(1, 'At least one key is required')
});

export const MoveMouseSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  target: z.string().optional()
});

export const ClickSchema = z.object({
  target: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional()
});

export const DoubleClickSchema = z.object({
  target: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional()
});

export const RightClickSchema = z.object({
  target: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional()
});

export const ScrollSchema = z.object({
  direction: z.enum(['up', 'down', 'left', 'right']).default('down'),
  amount: z.number().default(3)
});

export const InspectScreenSchema = z.object({
  region: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number()
  }).optional(),
  prompt: z.string().optional()
});

export const FindVisibleTextSchema = z.object({
  text: z.string().min(1, 'Text to search on screen is required')
});
