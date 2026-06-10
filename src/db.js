import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const INITIAL_PETS = [
  {
    id: "rocky",
    name: "Rocky",
    age: "6 meses",
    category: "puppy",
    traits: ["Juguetón", "Amistoso", "Mestizo"],
    description: "Rocky es una bola de energía y dulzura. Le fascina jugar con ramas de árboles, se lleva excelente con otros perros y adora estar rodeado de niños. Muy mimoso y compañero.",
    image: "./puppy_golden.png",
    adopted: false
  },
  {
    id: "luna",
    name: "Luna",
    age: "2 años",
    category: "adult",
    traits: ["Inteligente", "Activa", "Ovejerita"],
    description: "Luna es sumamente inteligente, leal y protectora. Sabe caminar perfectamente con correa y responde a órdenes básicas de obediencia. Ideal para casas con patio amplio o familias activas.",
    image: "./adult_shepherd.png",
    adopted: false
  },
  {
    id: "milo",
    name: "Milo",
    age: "8 años",
    category: "senior",
    traits: ["Tranquilo", "Dormilón", "Cariñoso"],
    description: "Milo es el rey de la calma. Ideal para departamentos o personas mayores, ya que no exige paseos largos, solo una buena camita mullida, amor diario y paseos lentos para olfatear flores.",
    image: "./senior_dog.png",
    adopted: false
  },
  {
    id: "toby",
    name: "Toby",
    age: "5 meses",
    category: "puppy",
    traits: ["Curioso", "Aventurero", "Sociable"],
    description: "Toby fue rescatado de una zanja en una tormenta. Hoy está sano, fuerte y lleno de amor. Es súper curioso, le encanta explorar y sigue a todos lados buscando caricias.",
    image: "./puppy_black.png",
    adopted: false
  },
  {
    id: "clara",
    name: "Clara",
    age: "4 meses",
    category: "puppy",
    traits: ["Mimosa", "Faldera", "Chiquita"],
    description: "Clara es la más pequeña del grupo. Le encanta acurrucarse en tu regazo para dormir la siesta y lloriquea despacito si no le prestás atención. Ideal para departamentos.",
    image: "./puppy_golden.png",
    adopted: false
  },
  {
    id: "frida",
    name: "Frida",
    age: "10 años",
    category: "senior",
    traits: ["Dulce", "Paciente", "Lanuda"],
    description: "Frida es una abuela tierna y súper tranquila. Su pelo es extremadamente suave. Se lleva bien con gatos y otros perros viejitos. Busca un rincón calentito donde pasar su jubilación.",
    image: "./senior_fluffy.png",
    adopted: false
  },
  {
    id: "simon",
    name: "Simón",
    age: "3 años",
    category: "adult",
    traits: ["Sociable", "Paseador", "Cariñoso"],
    description: "Simón es puro corazón. Le apasiona salir a pasear, olfatear todo y es extremadamente dócil. Su cola no para de moverse cuando ve personas. Se adapta a cualquier ambiente familiar.",
    image: "./adult_shepherd.png",
    adopted: false
  },
  {
    id: "olivia",
    name: "Olivia",
    age: "1.5 años",
    category: "adult",
    traits: ["Activa", "Guardiana", "Cariñosa"],
    description: "Olivia es una perra joven, de tamaño mediano-grande, muy guardiana y juguetona. Requiere paseos y desgaste físico, pero en casa es súper mimosa y le encanta dormir en los pies.",
    image: "./adult_shepherd.png",
    adopted: false
  },
  {
    id: "polo",
    name: "Polo",
    age: "9 años",
    category: "senior",
    traits: ["Compañero", "Silencioso", "Cariñoso"],
    description: "Polo es un Golden Retriever mix que pasó toda su vida en la calle hasta que lo rescatamos rengueando. Con su tratamiento terminado, hoy camina bien y solo busca mimos eternos en silencio.",
    image: "./senior_dog.png",
    adopted: false
  }
];

// Async database helpers
export async function getPets() {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Seeding check: If database is online but completely empty, load defaults
    if (data.length === 0) {
      await resetPets();
      return INITIAL_PETS;
    }
    
    return data;
  } catch (err) {
    console.error('Error fetching pets from Supabase: ', err.message);
    // Fallback: If Supabase connection configuration fails or is invalid, read from LocalStorage
    const local = localStorage.getItem('pets');
    if (local) return JSON.parse(local);
    return INITIAL_PETS;
  }
}

export async function savePet(pet) {
  try {
    if (pet.id) {
      // Update existing
      const { data, error } = await supabase
        .from('pets')
        .update(pet)
        .eq('id', pet.id)
        .select();
        
      if (error) throw error;
      return data[0];
    } else {
      // Create new
      pet.id = 'pet_' + Date.now();
      const { data, error } = await supabase
        .from('pets')
        .insert([pet])
        .select();
        
      if (error) throw error;
      return data[0];
    }
  } catch (err) {
    console.error('Error saving pet to Supabase: ', err.message);
    // Fallback LocalStorage update
    const local = localStorage.getItem('pets') ? JSON.parse(localStorage.getItem('pets')) : INITIAL_PETS;
    if (pet.id) {
      const idx = local.findIndex(p => p.id === pet.id);
      if (idx !== -1) local[idx] = { ...local[idx], ...pet };
    } else {
      pet.id = 'pet_' + Date.now();
      local.push(pet);
    }
    localStorage.setItem('pets', JSON.stringify(local));
    return pet;
  }
}

export async function deletePet(id) {
  try {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (err) {
    console.error('Error deleting pet from Supabase: ', err.message);
    // Fallback local delete
    let local = localStorage.getItem('pets') ? JSON.parse(localStorage.getItem('pets')) : INITIAL_PETS;
    local = local.filter(p => p.id !== id);
    localStorage.setItem('pets', JSON.stringify(local));
  }
}

export async function resetPets() {
  try {
    // Delete all rows in pets table
    const { error: deleteError } = await supabase
      .from('pets')
      .delete()
      .neq('id', 'dummy_id_never_match'); // match all records

    if (deleteError) throw deleteError;

    // Load initial 9 pets
    const { data, error: insertError } = await supabase
      .from('pets')
      .insert(INITIAL_PETS)
      .select();

    if (insertError) throw insertError;
    return data;
  } catch (err) {
    console.error('Error resetting database on Supabase: ', err.message);
    localStorage.setItem('pets', JSON.stringify(INITIAL_PETS));
    return INITIAL_PETS;
  }
}
