import { Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../app';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import bcrypt from 'bcryptjs';

export const getEmployees = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { department } = req.query;
    const whereClause: any = {
      role: Role.EMPLOYEE,
    };
    if (department) {
      whereClause.department = String(department);
    }

    const employees = await (prisma.user as any).findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        status: true,
      },
    });
    res.json(employees);
  } catch (error) {
    console.error('getEmployees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployeeById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const employee = await (prisma.user as any).findUnique({
      where: { id: req.params.id as string, role: Role.EMPLOYEE },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        status: true,
      } as any,
    });

    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }

    // Get visitor activity
    const activity = {
      totalAppointments: 0,
      approved: 0,
      rejected: 0,
      completed: 0
    };

    const hostVisits = await (prisma.visit as any).findMany({
      where: { hostId: employee.id }
    });

    activity.totalAppointments = hostVisits.length;
    activity.approved = hostVisits.filter((v: any) => v.status === 'APPROVED' || v.status === 'CHECKED_IN' || v.status === 'COMPLETED').length;
    activity.rejected = hostVisits.filter((v: any) => v.status === 'REJECTED').length;
    activity.completed = hostVisits.filter((v: any) => v.status === 'COMPLETED').length;

    res.json({ ...employee, activity });
  } catch (error) {
    console.error('getEmployeeById error:', error);
    res.status(500).json({ error: 'Failed to fetch employee details' });
  }
};

export const createEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, employeeId, phone, email, department, designation, role, status } = req.body;

    // Use default password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('employee123', salt);

    const newEmployee = await (prisma.user as any).create({
      data: {
        name,
        employeeId,
        phone,
        email,
        passwordHash,
        role: role as Role || Role.EMPLOYEE,
        department,
        designation,
        status: status || 'ACTIVE',
      }
    });

    res.status(201).json({ id: newEmployee.id, message: 'Employee created successfully' });
  } catch (error: any) {
    console.error('createEmployee error:', error);
    res.status(500).json({ error: error.message || 'Failed to create employee' });
  }
};

export const updateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, employeeId, phone, email, department, designation, role, status } = req.body;
    
    await (prisma.user as any).update({
      where: { id: req.params.id as string },
      data: {
        name,
        employeeId,
        phone,
        email,
        role: role as Role,
        department,
        designation,
        status,
      }
    });

    res.json({ message: 'Employee updated successfully' });
  } catch (error: any) {
    console.error('updateEmployee error:', error);
    res.status(500).json({ error: error.message || 'Failed to update employee' });
  }
};

export const deactivateEmployee = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await (prisma.user as any).update({
      where: { id: req.params.id as string },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Employee deactivated successfully' });
  } catch (error) {
    console.error('deactivateEmployee error:', error);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
};
