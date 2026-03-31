import { describe, it, expect } from 'vitest'
import {
  normalizeTerm,
  extractQueryTerms,
  keywordOverlapScore,
  categoryMatchScore,
} from '../src/utils/retrievalScoring.js'

describe('retrievalScoring', () => {
  describe('normalizeTerm', () => {
    it('should lowercase and remove punctuation', () => {
      expect(normalizeTerm('Terraform,')).toBe('terraform')
      expect(normalizeTerm('OpenStack!')).toBe('openstack')
      expect(normalizeTerm('Clean-Code')).toBe('clean-code')
    })
  })

  describe('extractQueryTerms', () => {
    it('should split, normalize, and remove short terms', () => {
      const result = extractQueryTerms('How to use Terraform on OpenStack?')
      expect(result).toEqual(['how', 'use', 'terraform', 'openstack'])
    })

    it('should remove terms shorter than 3 chars', () => {
      const result = extractQueryTerms('IaC on VM in OS')
      expect(result).toEqual(['iac'])
    })
  })

  describe('keywordOverlapScore', () => {
    it('should return 0 if queryTerms is empty', () => {
      expect(keywordOverlapScore([], ['terraform', 'openstack'])).toBe(0)
    })

    it('should return 0 if keywords is empty', () => {
      expect(keywordOverlapScore(['terraform'], [])).toBe(0)
    })

    it('should calculate overlap ratio correctly', () => {
      const score = keywordOverlapScore(
        ['terraform', 'openstack', 'ansible'],
        ['terraform', 'ansible'],
      )

      expect(score).toBeCloseTo(2 / 3)
    })

    it('should normalize keywords before matching', () => {
      const score = keywordOverlapScore(
        ['terraform', 'openstack'],
        ['Terraform,', 'OpenStack!'],
      )

      expect(score).toBe(1)
    })
  })

  describe('categoryMatchScore', () => {
    it('should return 1 for terraform query and terraform category', () => {
      expect(categoryMatchScore('Generate Terraform config', 'terraform_docs')).toBe(1)
    })

    it('should return 1 for ansible query and ansible category', () => {
      expect(categoryMatchScore('Use Ansible playbook', 'iac_guide_ansible')).toBe(1)
    })

    it('should return 1 for openstack query and openstack category', () => {
      expect(categoryMatchScore('Provision on OpenStack', 'openstack_docs')).toBe(1)
    })

    it('should return 0 when there is no category match', () => {
      expect(categoryMatchScore('Generate Terraform config', 'clean_code_article')).toBe(0)
    })

    it('should return 0 for empty category', () => {
      expect(categoryMatchScore('Generate Terraform config', '')).toBe(0)
    })
  })
})