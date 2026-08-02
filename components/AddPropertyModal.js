'use client'

import { useState } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'

export default function AddPropertyModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    listing_type: 'rent',
    price: '',
    province: '',
    city: '',
    area: '',
    bedrooms: '1',
    bathrooms: '1',
    parking: '0',
    property_type: 'apartment',
    description: '',
    furnished: false,
    pets_allowed: false,
    availability: 'now',
  })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files])
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(form, images)
    setLoading(false)
    setForm({
      title: '',
      listing_type: 'rent',
      price: '',
      province: '',
      city: '',
      area: '',
      bedrooms: '1',
      bathrooms: '1',
      parking: '0',
      property_type: 'apartment',
      description: '',
      furnished: false,
      pets_allowed: false,
      availability: 'now',
    })
    setImages([])
    setStep(1)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-xl font-bold">List New Property</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Listing Type */}
          <div>
            <label className="text-sm font-medium block mb-1">Listing Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="listing_type"
                  value="rent"
                  checked={form.listing_type === 'rent'}
                  onChange={handleChange}
                  className="text-signal"
                />
                Rent
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="listing_type"
                  value="sell"
                  checked={form.listing_type === 'sell'}
                  onChange={handleChange}
                  className="text-signal"
                />
                Sell
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium block mb-1">Title</label>
            <input
              name="title"
              placeholder="e.g. Beautiful 2-bed in Sea Point"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium block mb-1">Price (R)</label>
            <input
              name="price"
              type="number"
              placeholder="15000"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Province</label>
              <input
                name="province"
                placeholder="Western Cape"
                value={form.province}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">City</label>
              <input
                name="city"
                placeholder="Cape Town"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Area / Suburb</label>
            <input
              name="area"
              placeholder="Sea Point"
              value={form.area}
              onChange={handleChange}
            />
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Property Type</label>
              <select
                name="property_type"
                value={form.property_type}
                onChange={handleChange}
                className="w-full"
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="townhouse">Townhouse</option>
                <option value="studio">Studio</option>
                <option value="room">Room</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Bedrooms</label>
              <select
                name="bedrooms"
                value={form.bedrooms}
                onChange={handleChange}
                className="w-full"
              >
                <option value="0">Studio</option>
                <option value="1">1</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Bathrooms</label>
              <select
                name="bathrooms"
                value={form.bathrooms}
                onChange={handleChange}
                className="w-full"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3+</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Parking</label>
              <select
                name="parking"
                value={form.parking}
                onChange={handleChange}
                className="w-full"
              >
                <option value="0">None</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="furnished"
                checked={form.furnished}
                onChange={handleChange}
                className="w-4 h-4 text-signal"
              />
              Furnished
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="pets_allowed"
                checked={form.pets_allowed}
                onChange={handleChange}
                className="w-4 h-4 text-signal"
              />
              Pets Allowed
            </label>
          </div>

          {/* Availability */}
          <div>
            <label className="text-sm font-medium block mb-1">Availability</label>
            <select
              name="availability"
              value={form.availability}
              onChange={handleChange}
              className="w-full"
            >
              <option value="now">Available Now</option>
              <option value="this_month">This Month</option>
              <option value="next_month">Next Month</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium block mb-1">Description</label>
            <textarea
              name="description"
              placeholder="Describe your property..."
              value={form.description}
              onChange={handleChange}
              rows="4"
              className="w-full"
            />
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-medium block mb-1">Photos</label>
            <div className="border-2 border-dashed border-line rounded-card p-4 text-center hover:border-signal transition">
              <Upload className="w-6 h-6 text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">Drop images or click to upload</p>
              <p className="text-xs text-muted">Max 5MB per image</p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="btn-secondary text-sm inline-block mt-2 cursor-pointer"
              >
                Select Images
              </label>
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-card overflow-hidden border border-line">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`Preview ${i}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </div>
    </div>
  )
}