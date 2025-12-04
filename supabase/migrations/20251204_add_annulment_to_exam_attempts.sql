-- Add annulment fields to mooc_exam_attempts
ALTER TABLE mooc_exam_attempts 
ADD COLUMN IF NOT EXISTS is_annulled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS annulment_reason text;

-- Add comment to explain usage
COMMENT ON COLUMN mooc_exam_attempts.is_annulled IS 'Indicates if the exam attempt was annulled/voided (e.g. for plagiarism)';
COMMENT ON COLUMN mooc_exam_attempts.annulment_reason IS 'Reason for annulment (e.g. "Plagio detectado", "Falla técnica")';
