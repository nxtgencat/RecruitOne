'use client'

import { useState, useEffect } from 'react'
import { createJob, generateJobDescription, getCompanies } from '@/lib/clientDbService'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wand2, Loader2 } from 'lucide-react'

interface CreateJobDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJobCreate: (job: any) => void
}

export function CreateJobDialog({
  open,
  onOpenChange,
  onJobCreate,
}: CreateJobDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<any[]>([])

  const [formData, setFormData] = useState({
    title: '',
    status: 'Open',
    company_id: '',
    company_name: '', // For display/search if needed
    noteForCandidates: '',
    fullAddress: '',
    city: '',
    locality: '',
    jobDescription: '',
    minExperience: 0,
    maxExperience: 0,
    billRate: 0,
    payRate: 0,
    minSalary: 0,
    maxSalary: 0,
    openings: 1,
    contactName: '',
    contactEmail: '',
    contactNumber: '',
    owner: '',
    hiringPipeline: '',
    jobCategory: '',
    jobLocationType: '',
    postalCode: '',
    targetCompanies: '',
    state: '',
    country: '',
    collaborator: '',
    hotlist: false,
    enableJobApplicationForm: false,
    keywords: '',
  })

  useEffect(() => {
    if (open) {
      fetchCompanies()
    }
  }, [open])

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies()
      setCompanies(data)
    } catch (error) {
      console.error('Failed to fetch companies:', error)
    }
  }

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.keywords) {
      setError('Please enter a Job Title and Skills/Keywords to generate a description.')
      return
    }

    setIsGenerating(true)
    setError(null)
    try {
      // Pass company name for better JD generation
      const jdData = {
        ...formData,
        company: formData.company_name
      }
      const description = await generateJobDescription(jdData);
      setFormData(prev => ({ ...prev, jobDescription: description }))
    } catch (error) {
      console.error('Error generating JD:', error)
      setError('Failed to generate job description. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.company_id) {
      setError('Please select a company.')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const result = await createJob(formData);

      onJobCreate(result)
      resetForm()
      onOpenChange(false)
      toast.success('Job created successfully')
    } catch (err: any) {
      console.error('Error creating job:', err)
      setError(err.message || 'Failed to create job. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      status: 'Open',
      company_id: '',
      company_name: '',
      noteForCandidates: '',
      fullAddress: '',
      city: '',
      locality: '',
      jobDescription: '',
      minExperience: 0,
      maxExperience: 0,
      billRate: 0,
      payRate: 0,
      minSalary: 0,
      maxSalary: 0,
      openings: 1,
      contactName: '',
      contactEmail: '',
      contactNumber: '',
      owner: '',
      hiringPipeline: '',
      jobCategory: '',
      jobLocationType: '',
      postalCode: '',
      targetCompanies: '',
      state: '',
      country: '',
      collaborator: '',
      hotlist: false,
      enableJobApplicationForm: false,
      keywords: '',
    })
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => {
                  const selectedCompany = companies.find(c => c.$id === value)
                  setFormData({
                    ...formData,
                    company_id: value,
                    company_name: selectedCompany ? selectedCompany.name : ''
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.$id} value={company.$id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keywords">Skills / Keywords (Required for AI) *</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="e.g. React, Node.js, TypeScript"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="jobDescription">Job Description</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !formData.title || !formData.keywords}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3 h-3 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="jobDescription"
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              className="min-h-[150px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobLocationType">Location Type</Label>
              <Select
                value={formData.jobLocationType}
                onValueChange={(value) => setFormData({ ...formData, jobLocationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Location Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On-site">On-site</SelectItem>
                  <SelectItem value="Remote">Remote</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minExperience">Min Exp (years)</Label>
              <Input
                id="minExperience"
                type="number"
                value={formData.minExperience}
                onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxExperience">Max Exp (years)</Label>
              <Input
                id="maxExperience"
                type="number"
                value={formData.maxExperience}
                onChange={(e) => setFormData({ ...formData, maxExperience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minSalary">Min Salary</Label>
              <Input
                id="minSalary"
                type="number"
                value={formData.minSalary}
                onChange={(e) => setFormData({ ...formData, minSalary: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxSalary">Max Salary</Label>
              <Input
                id="maxSalary"
                type="number"
                value={formData.maxSalary}
                onChange={(e) => setFormData({ ...formData, maxSalary: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openings">Number of Openings</Label>
              <Input
                id="openings"
                type="number"
                value={formData.openings}
                onChange={(e) => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hotlist"
                checked={formData.hotlist}
                onCheckedChange={(checked) => setFormData({ ...formData, hotlist: checked as boolean })}
              />
              <Label htmlFor="hotlist">Hotlist</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
