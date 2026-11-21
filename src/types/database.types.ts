export type EstadoProyecto = 'Pendiente' | 'En Progreso' | 'Completado';
export const ESTADOS: readonly EstadoProyecto[] = [
  'Pendiente',
  'En Progreso',
  'Completado',
];
type Instalador = {
  id: string;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  certificacion: string | null;
  rol: 'admin' | 'instalador';
  activo: boolean;
  created_at: string;
};
export type Proyecto = {
  id: string;
  nombre_cliente: string;
  direccion_instalacion: string;
  capacidad_kw: number;
  estado: EstadoProyecto;
  fecha_inicio: string;
  fecha_estimada_fin: string | null;
  instalador_id: string;
  notas_tecnicas: string | null;
  created_at: string;
  updated_at: string;
};
type Material = {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidad_medida: string;
  stock_disponible: number;
};
type Asignacion = {
  proyecto_id: string;
  material_id: string;
  cantidad_asignada: number;
};
type Relation<
  Name extends string,
  Columns extends string[],
  Table extends string,
  Refs extends string[],
  One extends boolean = false,
> = {
  foreignKeyName: Name;
  columns: Columns;
  isOneToOne: One;
  referencedRelation: Table;
  referencedColumns: Refs;
};
type Table<Row, Insert, Relationships extends object[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Relationships;
};
export type ProyectoInsert = Pick<
  Proyecto,
  | 'nombre_cliente'
  | 'direccion_instalacion'
  | 'capacidad_kw'
  | 'fecha_inicio'
  | 'instalador_id'
> &
  Partial<
    Omit<
      Proyecto,
      | 'nombre_cliente'
      | 'direccion_instalacion'
      | 'capacidad_kw'
      | 'fecha_inicio'
      | 'instalador_id'
    >
  >;
export type Database = {
  public: {
    Tables: {
      instaladores: Table<
        Instalador,
        Pick<Instalador, 'id' | 'nombre_completo' | 'email'> &
          Partial<Omit<Instalador, 'id' | 'nombre_completo' | 'email'>>
      >;
      proyectos: Table<
        Proyecto,
        ProyectoInsert,
        [
          Relation<
            'proyectos_instalador_id_fkey',
            ['instalador_id'],
            'instaladores',
            ['id']
          >,
        ]
      >;
      materiales: Table<
        Material,
        Omit<Material, 'id' | 'stock_disponible'> &
          Partial<Pick<Material, 'id' | 'stock_disponible'>>
      >;
      proyecto_materiales: Table<
        Asignacion,
        Asignacion,
        [
          Relation<
            'proyecto_materiales_proyecto_id_fkey',
            ['proyecto_id'],
            'proyectos',
            ['id']
          >,
          Relation<
            'proyecto_materiales_material_id_fkey',
            ['material_id'],
            'materiales',
            ['id']
          >,
        ]
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      es_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      es_activo: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: { estado_proyecto: EstadoProyecto };
    CompositeTypes: { [_ in never]: never };
  };
};
