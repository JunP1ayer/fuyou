// Phase 4: Optimization API Routes
// Express routes for optimization constraint management

import express, { Request, Response } from 'express';
import { constraintService } from '../services/constraintService';
import { requireAuthOrDemo } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { validateSchema } from '../middleware/validation';
import {
  CreateOptimizationConstraintSchema,
  UpdateOptimizationConstraintSchema,
  CreateAvailabilitySlotSchema,
  UpdateAvailabilitySlotSchema,
  CreateUserOptimizationPreferencesSchema,
  UpdateUserOptimizationPreferencesSchema,
  CreateOptimizationRunSchema
} from '../types/optimization';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuthOrDemo);

// ========== Optimization Constraints Routes ==========

/**
 * POST /api/optimization/constraints
 * Create a new optimization constraint
 */
router.post('/constraints', 
  validateSchema(CreateOptimizationConstraintSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const constraint = await constraintService.createConstraint(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: constraint,
      message: 'Optimization constraint created successfully'
    });
  })
);

/**
 * GET /api/optimization/constraints
 * Get all optimization constraints for the user
 */
router.get('/constraints',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const activeOnly = req.query.active_only === 'true';
    
    const constraints = await constraintService.getConstraints(userId, activeOnly);
    
    res.json({
      success: true,
      data: constraints,
      meta: {
        total: constraints.length
      }
    });
  })
);

/**
 * GET /api/optimization/constraints/:constraintId
 * Get a specific optimization constraint
 */
router.get('/constraints/:constraintId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { constraintId } = req.params;
    
    const constraints = await constraintService.getConstraints(userId, false);
    const constraint = constraints.find(c => c.id === constraintId);
    
    if (!constraint) {
      return res.status(404).json({
        success: false,
        error: { message: 'Constraint not found' }
      });
    }
    
    res.json({
      success: true,
      data: constraint
    });
  })
);

/**
 * PUT /api/optimization/constraints/:constraintId
 * Update an optimization constraint
 */
router.put('/constraints/:constraintId',
  validateSchema(UpdateOptimizationConstraintSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { constraintId } = req.params;
    
    const constraint = await constraintService.updateConstraint(userId, constraintId, req.body);
    
    res.json({
      success: true,
      data: constraint,
      message: 'Optimization constraint updated successfully'
    });
  })
);

/**
 * DELETE /api/optimization/constraints/:constraintId
 * Delete an optimization constraint
 */
router.delete('/constraints/:constraintId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { constraintId } = req.params;
    
    await constraintService.deleteConstraint(userId, constraintId);
    
    res.json({
      success: true,
      message: 'Optimization constraint deleted successfully'
    });
  })
);

/**
 * POST /api/optimization/constraints/validate
 * Validate all constraints against current user data
 */
router.post('/constraints/validate',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const validation = await constraintService.validateConstraints(userId);
    
    res.json({
      success: true,
      data: validation
    });
  })
);

// ========== Availability Slots Routes ==========

/**
 * POST /api/optimization/availability
 * Create a new availability slot
 */
router.post('/availability',
  validateSchema(CreateAvailabilitySlotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const slot = await constraintService.createAvailabilitySlot(userId, req.body);
    
    res.status(201).json({
      success: true,
      data: slot,
      message: 'Availability slot created successfully'
    });
  })
);

/**
 * GET /api/optimization/availability
 * Get all availability slots for the user
 */
router.get('/availability',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const slots = await constraintService.getAvailabilitySlots(userId);
    
    res.json({
      success: true,
      data: slots,
      meta: {
        total: slots.length
      }
    });
  })
);

/**
 * PUT /api/optimization/availability/:slotId
 * Update an availability slot
 */
router.put('/availability/:slotId',
  validateSchema(UpdateAvailabilitySlotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { slotId } = req.params;
    
    const slot = await constraintService.updateAvailabilitySlot(userId, slotId, req.body);
    
    res.json({
      success: true,
      data: slot,
      message: 'Availability slot updated successfully'
    });
  })
);

/**
 * DELETE /api/optimization/availability/:slotId
 * Delete an availability slot
 */
router.delete('/availability/:slotId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { slotId } = req.params;
    
    await constraintService.deleteAvailabilitySlot(userId, slotId);
    
    res.json({
      success: true,
      message: 'Availability slot deleted successfully'
    });
  })
);

// ========== User Preferences Routes ==========

/**
 * GET /api/optimization/preferences
 * Get user optimization preferences
 */
router.get('/preferences',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const preferences = await constraintService.getUserPreferences(userId);
    
    res.json({
      success: true,
      data: preferences
    });
  })
);

/**
 * PUT /api/optimization/preferences
 * Update user optimization preferences
 */
router.put('/preferences',
  validateSchema(UpdateUserOptimizationPreferencesSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    const preferences = await constraintService.updateUserPreferences(userId, req.body);
    
    res.json({
      success: true,
      data: preferences,
      message: 'User preferences updated successfully'
    });
  })
);

// ========== Optimization Runs Routes (Placeholder) ==========

/**
 * POST /api/optimization/run
 * Start an optimization run
 */
router.post('/run',
  validateSchema(CreateOptimizationRunSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { objectiveType, timePeriodStart, timePeriodEnd, algorithmUsed } = req.body;
    
    // Get user constraints
    const constraints = await constraintService.getConstraints(userId);
    
    // Get job sources (from existing shifts service)
    const jobSources: any[] = []; // TODO: Implement job sources retrieval
    
    // Get existing shifts
    const existingShifts: any[] = []; // TODO: Implement existing shifts retrieval
    
    // Get availability slots
    const availability = await constraintService.getAvailabilitySlots(userId);
    
    // Get user preferences
    const preferences = await constraintService.getUserPreferences(userId);
    
    // Import the integration service
    const { optimizationIntegrationService } = await import('../services/optimizationIntegrationService');
    
    // Run optimization
    const result = await optimizationIntegrationService.runOptimization(
      userId,
      objectiveType,
      { start: timePeriodStart, end: timePeriodEnd },
      constraints,
      jobSources,
      existingShifts,
      availability,
      preferences
    );
    
    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Optimization completed successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          message: result.error || 'Optimization failed',
          code: 'OPTIMIZATION_FAILED'
        }
      });
    }
  })
);

/**
 * POST /api/optimization/run/async
 * Start an asynchronous optimization run
 */
router.post('/run/async',
  validateSchema(CreateOptimizationRunSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { objectiveType, timePeriodStart, timePeriodEnd } = req.body;
    
    // Get user data
    const constraints = await constraintService.getConstraints(userId);
    const availability = await constraintService.getAvailabilitySlots(userId);
    const preferences = await constraintService.getUserPreferences(userId);
    
    // Import the integration service
    const { optimizationIntegrationService } = await import('../services/optimizationIntegrationService');
    
    // Start async optimization
    const result = await optimizationIntegrationService.startAsyncOptimization(
      userId,
      objectiveType,
      { start: timePeriodStart, end: timePeriodEnd },
      constraints,
      [] as any[], // job sources - TODO: implement
      [] as any[], // existing shifts - TODO: implement
      availability,
      preferences
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Async optimization started successfully'
    });
  })
);

/**
 * GET /api/optimization/runs/:runId/status
 * Get optimization run status
 */
router.get('/runs/:runId/status',
  asyncHandler(async (req: Request, res: Response) => {
    const { runId } = req.params;
    
    // Import the integration service
    const { optimizationIntegrationService } = await import('../services/optimizationIntegrationService');
    
    const status = await optimizationIntegrationService.getOptimizationStatus(runId);
    
    res.json({
      success: true,
      data: status
    });
  })
);

/**
 * GET /api/optimization/runs
 * Get optimization run history
 */
router.get('/runs',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    
    // TODO: Implement optimization run history from database
    
    res.json({
      success: true,
      data: [],
      meta: {
        total: 0
      }
    });
  })
);

/**
 * GET /api/optimization/runs/:runId
 * Get specific optimization run details
 */
router.get('/runs/:runId',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { runId } = req.params;
    
    // TODO: Implement optimization run details
    
    res.status(404).json({
      success: false,
      error: { message: 'Optimization run not found' }
    });
  })
);

/**
 * GET /api/optimization/runs/:runId/suggestions
 * Get optimization suggestions for a run
 */
router.get('/runs/:runId/suggestions',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { runId } = req.params;
    
    // TODO: Implement optimization suggestions
    
    res.json({
      success: true,
      data: [],
      meta: {
        total: 0
      }
    });
  })
);

// ========== Utility Routes ==========

/**
 * GET /api/optimization/algorithms
 * Get available optimization algorithms
 */
router.get('/algorithms',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Import the integration service
      const { optimizationIntegrationService } = await import('../services/optimizationIntegrationService');
      
      const algorithms = await optimizationIntegrationService.getAvailableAlgorithms();
      
      res.json({
        success: true,
        data: algorithms
      });
    } catch (error) {
      // Fallback to static algorithm list if service is unavailable
      const algorithms = [
        {
          id: 'linear_programming',
          name: 'Linear Programming',
          description: 'Fast linear optimization suitable for most scenarios',
          complexity: 'low',
          executionTime: 'fast',
          suitableFor: ['maximize_income', 'minimize_hours'],
          tierRequirement: 'free'
        },
        {
          id: 'genetic_algorithm',
          name: 'Genetic Algorithm',
          description: 'Advanced evolutionary optimization for complex constraints',
          complexity: 'medium',
          executionTime: 'medium',
          suitableFor: ['balance_sources', 'multi_objective'],
          tierRequirement: 'standard'
        },
        {
          id: 'multi_objective_nsga2',
          name: 'NSGA-II Multi-Objective',
          description: 'Advanced multi-objective optimization with Pareto solutions',
          complexity: 'high',
          executionTime: 'slow',
          suitableFor: ['multi_objective'],
          tierRequirement: 'pro'
        }
      ];
      
      res.json({
        success: true,
        data: algorithms,
        meta: {
          source: 'fallback'
        }
      });
    }
  })
);

/**
 * GET /api/optimization/tiers
 * Get available subscription tiers and their limits
 */
router.get('/tiers',
  asyncHandler(async (req: Request, res: Response) => {
    const tiers = {
      free: {
        name: 'Free',
        price: 0,
        features: [
          'Basic linear programming optimization',
          '5 optimization runs per month',
          'Standard constraints (fuyou limit, weekly hours)',
          'Email notifications'
        ],
        limits: {
          maxOptimizationRuns: 5,
          maxConstraints: 5,
          maxTimeHorizon: 30
        }
      },
      standard: {
        name: 'Standard',
        price: 500,
        features: [
          'All Free tier features',
          'Advanced algorithms (genetic algorithm)',
          '50 optimization runs per month',
          'Custom constraints',
          'Real-time notifications',
          'Export optimization results'
        ],
        limits: {
          maxOptimizationRuns: 50,
          maxConstraints: 15,
          maxTimeHorizon: 90
        }
      },
      pro: {
        name: 'Pro',
        price: 1200,
        features: [
          'All Standard tier features',
          'Multi-objective optimization',
          'Unlimited optimization runs',
          'Advanced analytics and reporting',
          'API access',
          'Priority support'
        ],
        limits: {
          maxOptimizationRuns: -1,
          maxConstraints: -1,
          maxTimeHorizon: 365
        }
      }
    };
    
    res.json({
      success: true,
      data: tiers
    });
  })
);

/**
 * GET /api/optimization/health
 * Health check for optimization service
 */
router.get('/health',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Import the integration service
      const { optimizationIntegrationService } = await import('../services/optimizationIntegrationService');
      
      // Check Python service health
      await optimizationIntegrationService.checkServiceHealth();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          pythonService: 'healthy'
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          pythonService: 'unavailable',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  })
);

/**
 * POST /api/optimization/constraints/bulk-validate
 * Validate multiple constraints at once
 */
router.post('/constraints/bulk-validate',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { constraints } = req.body;
    
    if (!Array.isArray(constraints)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Constraints must be an array' }
      });
    }
    
    try {
      // Import the integration service
      const { optimizationIntegrationService } = await import('../services/optimizationIntegrationService');
      
      // Transform constraints to our format
      const constraintObjects = constraints.map(c => ({
        id: c.id || 'temp',
        userId: userId,
        constraintType: c.constraintType,
        constraintValue: c.constraintValue,
        constraintUnit: c.constraintUnit,
        priority: c.priority || 1,
        isActive: c.isActive ?? true,
        metadata: c.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const validation = await optimizationIntegrationService.validateConstraints(constraintObjects);
      
      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      // Fallback to local validation if service is unavailable
      const validation = await constraintService.validateConstraints(userId);
      
      res.json({
        success: true,
        data: validation,
        meta: {
          source: 'fallback'
        }
      });
    }
  })
);

export { router as optimizationRoutes };