<?php

namespace App\Controller;

use App\Entity\Note;
use App\Entity\Project;
use App\Repository\NoteRepository;
use App\Repository\ProjectRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class NoteController extends AbstractController
{
    #[Route('/api/notes/project/{projectId}', name: 'api_notes_list', methods: ['GET'])]
    public function listNotes(int $projectId, NoteRepository $noteRepository): JsonResponse
    {
        $notes = $noteRepository->findBy(['project' => $projectId]);
        
        $notesData = array_map(function($note) {
            return [
                'id' => $note->getId(),
                'title' => $note->getTitle(),
                'content' => $note->getContent(),
                'type' => 'note', // Alle sind Notizen, später evtl. Ordner
                'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
            ];
        }, $notes);
        
        return new JsonResponse($notesData);
    }
    
    #[Route('/api/notes', name: 'api_notes_create', methods: ['POST'])]
    public function createNote(
        Request $request, 
        EntityManagerInterface $em,
        ProjectRepository $projectRepository
    ): JsonResponse 
    {
        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['title']) || !isset($data['project_id'])) {
            return new JsonResponse(['error' => 'Titel und Projekt-ID sind erforderlich'], 400);
        }
        
        $project = $projectRepository->find($data['project_id']);
        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden'], 404);
        }
        
        $note = new Note();
        $note->setTitle($data['title']);
        $note->setProject($project);
        $note->setContent($data['content'] ?? ''); // Content optional
        
        // Parent Note falls vorhanden
        if (isset($data['parent_id']) && $data['parent_id']) {
            $parentNote = $em->getRepository(Note::class)->find($data['parent_id']);
            if ($parentNote) {
                $note->setParentNote($parentNote);
            }
        }
        
        $em->persist($note);
        $em->flush();
        
        return new JsonResponse([
            'id' => $note->getId(),
            'title' => $note->getTitle(),
            'content' => $note->getContent(),
            'type' => 'note',
            'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
        ]);
    }
    
    #[Route('/api/notes/{id}', name: 'api_notes_get', methods: ['GET'])]
    public function getNote(int $id, NoteRepository $noteRepository): JsonResponse
    {
        $note = $noteRepository->find($id);
        
        if (!$note) {
            return new JsonResponse(['error' => 'Notiz nicht gefunden'], 404);
        }
        
        return new JsonResponse([
            'id' => $note->getId(),
            'title' => $note->getTitle(),
            'content' => $note->getContent(),
            'type' => 'note',
            'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
        ]);
    }
    
    #[Route('/api/notes/{id}', name: 'api_notes_update', methods: ['PUT'])]
    public function updateNote(
        int $id, 
        Request $request, 
        NoteRepository $noteRepository,
        EntityManagerInterface $em
    ): JsonResponse 
    {
        $note = $noteRepository->find($id);
        
        if (!$note) {
            return new JsonResponse(['error' => 'Notiz nicht gefunden'], 404);
        }
        
        $data = json_decode($request->getContent(), true);
        
        if (isset($data['title'])) {
            $note->setTitle($data['title']);
        }
        
        if (isset($data['content'])) {
            $note->setContent($data['content']);
        }
        
        $em->flush();
        
        return new JsonResponse([
            'id' => $note->getId(),
            'title' => $note->getTitle(),
            'content' => $note->getContent(),
            'type' => 'note',
            'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
        ]);
    }
    
    #[Route('/api/notes/{id}', name: 'api_notes_delete', methods: ['DELETE'])]
    public function deleteNote(
        int $id, 
        NoteRepository $noteRepository,
        EntityManagerInterface $em
    ): JsonResponse 
    {
        $note = $noteRepository->find($id);
        
        if (!$note) {
            return new JsonResponse(['error' => 'Notiz nicht gefunden'], 404);
        }
        
        // Prüfe ob die Notiz Child-Notizen hat
        $childNotes = $note->getChildNotes();
        if ($childNotes->count() > 0) {
            return new JsonResponse([
                'error' => 'Diese Notiz kann nicht gelöscht werden, da sie Unter-Notizen enthält.'
            ], 400);
        }
        
        $noteTitle = $note->getTitle();
        
        try {
            $em->remove($note);
            $em->flush();
            
            return new JsonResponse([
                'success' => true,
                'message' => 'Notiz "' . $noteTitle . '" wurde erfolgreich gelöscht.'
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'error' => 'Fehler beim Löschen der Notiz: ' . $e->getMessage()
            ], 500);
        }
    }
}