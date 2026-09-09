import { z } from "zod";

export const CreateSubmissionSchema = z.object({
  authorName: z.string().trim().min(1, "Author name is required"),
  authorEmail: z.string().trim().email("Invalid email address"),
  authorPhone: z.string().trim().min(1, "Phone number is required"),
  authorCountry: z.string().trim().min(1, "Country is required"),
  authorAddress: z.string().trim().min(1, "Address is required"),
  authorBio: z.string().optional().nullable().transform(v => v || ""),
  
  bookTitle: z.string().trim().min(1, "Book title is required"),
  bookSubtitle: z.string().optional().nullable(),
  bookGenre: z.string().trim().min(1, "Genre is required"),
  bookLanguage: z.string().trim().min(1, "Language is required"),
  wordCount: z.preprocess((val) => {
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const cleaned = String(val).replace(/,/g, "").match(/\d+/);
    return cleaned ? Number(cleaned[0]) : 0;
  }, z.number().min(0, "Word count must be non-negative")),
  pageCount: z.preprocess((val) => {
    if (!val) return undefined;
    const cleaned = String(val).replace(/,/g, "").match(/\d+/);
    return cleaned ? Number(cleaned[0]) : undefined;
  }, z.number().positive("Page count must be positive").optional()),
  synopsis: z.string().trim().min(1, "Synopsis is required"),
  keywords: z.string().optional().nullable().transform(v => v || ""),
  
  packageId: z.preprocess((val) => {
    if (!val) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().positive("Package ID must be valid").optional()),
  
  campaignId: z.string().optional().nullable(),
  campaignName: z.string().optional().nullable(),
  submissionType: z.string().optional().nullable(),
  authorInstagram: z.string().optional().nullable(),

  agreedOriginal: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
  agreedCopyright: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
  agreedNotPublished: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
  agreedPolicies: z.preprocess((val) => val === 'true' || val === true, z.boolean()),
});

export type CreateSubmissionDto = z.infer<typeof CreateSubmissionSchema>;

export const UpdateSubmissionStatusSchema = z.object({
  status: z.enum([
    'Submitted', 
    'Under Editorial Review', 
    'Accepted', 
    'Editing', 
    'Cover Design', 
    'Payment Verified', 
    'ISBN Assigned', 
    'Published'
  ])
});

export type UpdateSubmissionStatusDto = z.infer<typeof UpdateSubmissionStatusSchema>;
