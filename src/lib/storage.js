// storage.js — handles uploading the actual file bytes to Supabase Storage,

import { supabase, DOCUMENTS_BUCKET } from "./supabase";

export async function uploadFile(file) {

  const uniquePath = `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(uniquePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error("File upload failed: " + error.message);
  }

  return {
    path: data.path,
    fileName: file.name,
    size: file.size,
  };
}


export async function getSignedFileUrl(path) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60);

  if (error) {
    throw new Error("Couldn't generate file link: " + error.message);
  }

  return data.signedUrl;
}
