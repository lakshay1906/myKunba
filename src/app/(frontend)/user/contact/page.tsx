'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Send, Github, Twitter, Linkedin } from 'lucide-react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [errors, setErrors] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, any> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()

    if (validateForm()) {
      setIsSubmitting(true)

      // Simulate form submission
      setTimeout(() => {
        setIsSubmitting(false)
        setSubmitSuccess(true)
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        })

        // Reset success message after 5 seconds
        setTimeout(() => {
          setSubmitSuccess(false)
        }, 5000)
      }, 1500)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Have a question, suggestion, or want to contribute to our blog? We'd love to hear from
              you! Fill out the form or reach out to us directly using the contact information
              below.
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-blue-500 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">contact@myblog.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="w-5 h-5 text-blue-500 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-blue-500 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium">Address</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    123 Blog Street, Suite 101
                    <br />
                    San Francisco, CA 94103
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">Follow Us</h2>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Github className="w-6 h-6" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Twitter className="w-6 h-6" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Linkedin className="w-6 h-6" />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>

          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
              Thank you for your message! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-md border ${
                  errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
              ></textarea>
              {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 h-80">
        <h2 className="text-2xl font-semibold mb-4">Find Us</h2>
        <div className="h-64 w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Replace with an actual map component if needed */}
          <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p className="text-center">
              Interactive Map
              <br />
              <span className="text-sm">
                (Google Maps or other map service would be embedded here)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
