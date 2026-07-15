import { z } from "zod";

export const CreateSubmissionSchema = z.object({
  authorName: z.string().min(1, "Author name is required"),
  authorEmail: z.string().email("Invalid email address"),
  authorPhone: z.string().min(1, "Phone number is required"),
  authorCountry: z.string().min(1, "Country is required"),
  authorAddress: z.string().min(1, "Address is required"),
  authorBio: z.string().optional(),
  
  bookTitle: z.string().min(1, "Book title is required"),
  bookSubtitle: z.string().optional(),
  bookGenre: z.string().min(1, "Genre is required"),
  bookLanguage: z.string().min(1, "Language is required"),
  wordCount: z.preprocess((val) => Number(val), z.number().positive("Word count must be positive")),
  pageCount: z.preprocess((val) => Number(val), z.number().positive("Page count must be positive")).optional(),
  synopsis: z.string().min(1, "Synopsis is required"),
  keywords: z.string().optional(),
  
  packageId: z.preprocess((val) => Number(val), z.number().positive("Package ID must be valid")),
  
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
