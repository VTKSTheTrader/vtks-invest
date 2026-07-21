import { supabase } from "../lib/supabase";

const BUCKET = "library-files";

export const getResources = async () => {
  const { data, error } = await supabase
    .from("library")
    .select("*")
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};

export const uploadLibraryFile = async (file) => {
  if (!file) return null;

  const fileExt = file.name.split(".").pop();

  const fileName =
    Date.now() +
    "-" +
    Math.random().toString(36).substring(2) +
    "." +
    fileExt;

  const filePath = `resources/${fileName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file);

  if (error) {
  console.error("UPLOAD ERROR FULL:");
  console.log(JSON.stringify(error, null, 2));
  console.error(error);
  throw error;
}

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};
export const addResource = async (resource) => {
  const { data, error } = await supabase
    .from("library")
    .insert([
      {
        title: resource.title,
        category: resource.category,
        type: resource.type,
        source_type: resource.sourceType,
        access: resource.access,
        url: resource.url,
        description: resource.description,
        status: resource.status,
        featured: resource.featured || false,
        pinned: resource.pinned || false,
        views: Number(resource.views || 0),
      },
    ])
    .select();

  if (error) {
    console.error("SUPABASE ERROR:", error);
    throw error;
  }

  return data[0];
};
export const updateResource = async (id, resource) => {
  const { data, error } = await supabase
    .from("library")
    .update({
      title: resource.title,
      category: resource.category,
      type: resource.type,
      source_type: resource.sourceType,
      access: resource.access,
      url: resource.url,
      description: resource.description,
      status: resource.status,
      featured: resource.featured || false,
      pinned: resource.pinned || false,
      views: Number(resource.views || 0),
      updated_at: new Date(),
    })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteResource = async (id) => {
  const { error } = await supabase.from("library").delete().eq("id", id);
  if (error) throw error;
};

export const mapResourceFromDB = (r) => ({
  id: r.id,
  title: r.title,
  category: r.category,
  type: r.type,
  sourceType: r.source_type,
  access: r.access,
  url: r.url,
  description: r.description,
  status: r.status,
  featured: r.featured,
  pinned: r.pinned,
  views: r.views,
  uploaded: r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-IN")
    : "",
  updatedAt: r.updated_at
    ? new Date(r.updated_at).toLocaleDateString("en-IN")
    : "",
});