// storage.js — handles uploading the actual file bytes to Supabase Storage,
// and generating temporary signed URLs so only logged-in users can view files
// (the bucket itself is private).

import { supabase, DOCUMENTS_BUCKET } from "./supabase";

// Uploads a file and returns info we'll save into the Firestore document record.
export async function uploadFile(file) {
  // Give every file a unique path so two people uploading "invoice.pdf"
  // don't overwrite each other.
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
    path: data.path,       // store this in Firestore — we need it to fetch the file later
    fileName: file.name,
    size: file.size,
  };
}

// Generates a temporary signed URL (valid for 1 hour) so a logged-in user
// can view/download a private file without making the whole bucket public.
export async function getSignedFileUrl(path) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour, in seconds

  if (error) {
    throw new Error("Couldn't generate file link: " + error.message);
  }

  return data.signedUrl;
}
