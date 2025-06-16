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
    /**
     * Notizen für ein Projekt laden (mit Slug!)
     */
    #[Route('/api/notes/project-slug/{slug}', name: 'api_notes_by_project_slug', methods: ['GET'])]
    public function getNotesByProjectSlug(string $slug, ProjectRepository $projectRepository, NoteRepository $noteRepository): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $project = $projectRepository->findOneBy([
            'slug' => $slug,
            'owner' => $this->getUser()
        ]);

        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder kein Zugriff'], 404);
        }

        $notes = $noteRepository->findBy(['project' => $project]);

        $notesData = array_map(function (Note $note) {
            return [
                'id' => $note->getId(),
                'title' => $note->getTitle(),
                'content' => $note->getContent(),
                'type' => 'note',
                'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
                // ✅ ENTFERNT: createdAt und updatedAt (existieren nicht)
            ];
        }, $notes);

        return new JsonResponse($notesData);
    }

    #[Route('/api/notes/project/{projectId}', name: 'api_notes_list', methods: ['GET'])]
    public function listNotes(int $projectId, NoteRepository $noteRepository, ProjectRepository $projectRepository): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $project = $projectRepository->findOneBy(['id' => $projectId, 'owner' => $this->getUser()]);
        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder kein Zugriff'], 404);
        }

        $notes = $noteRepository->findBy(['project' => $projectId]);
        
        $notesData = array_map(function($note) {
            return [
                'id' => $note->getId(),
                'title' => $note->getTitle(),
                'content' => $note->getContent(),
                'type' => 'note',
                'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
            ];
        }, $notes);
        
        return new JsonResponse($notesData);
    }
    
    #[Route('/api/notes', name: 'api_notes_create', methods: ['POST'])]
    public function createNote(Request $request, EntityManagerInterface $em, ProjectRepository $projectRepository): JsonResponse 
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['title']) || trim($data['title']) === '') {
            return new JsonResponse(['error' => 'Titel ist erforderlich'], 400);
        }

        $project = null;
        
        if (isset($data['project_slug'])) {
            $project = $projectRepository->findOneBy([
                'slug' => $data['project_slug'],
                'owner' => $this->getUser()
            ]);
        } elseif (isset($data['project_id'])) {
            $project = $projectRepository->findOneBy([
                'id' => $data['project_id'],
                'owner' => $this->getUser()
            ]);
        }

        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder kein Zugriff'], 404);
        }
        
        $note = new Note();
        $note->setTitle(trim($data['title']));
        $note->setProject($project);
        $note->setContent($data['content'] ?? '');
        
        if (isset($data['parent_id']) && $data['parent_id']) {
            $parentNote = $em->getRepository(Note::class)->find($data['parent_id']);
            if ($parentNote && $parentNote->getProject() === $project) {
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
            'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null,
            'project' => [
                'id' => $project->getId(),
                'slug' => $project->getSlug(),
                'title' => $project->getTitle()
            ]
        ], 201);
    }
    
    #[Route('/api/notes/{id}', name: 'api_notes_get', methods: ['GET'])]
    public function getNote(int $id, NoteRepository $noteRepository): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $note = $noteRepository->find($id);
        
        if (!$note) {
            return new JsonResponse(['error' => 'Notiz nicht gefunden'], 404);
        }

        if ($note->getProject()->getOwner() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Kein Zugriff auf diese Notiz'], 403);
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
    public function updateNote(int $id, Request $request, NoteRepository $noteRepository, EntityManagerInterface $em): JsonResponse 
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $note = $noteRepository->find($id);
        
        if (!$note) {
            return new JsonResponse(['error' => 'Notiz nicht gefunden'], 404);
        }

        if ($note->getProject()->getOwner() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Kein Zugriff auf diese Notiz'], 403);
        }
        
        $data = json_decode($request->getContent(), true);
        
        if (isset($data['title']) && trim($data['title']) === '') {
            return new JsonResponse(['error' => 'Titel darf nicht leer sein'], 400);
        }
        
        if (isset($data['title'])) {
            $note->setTitle(trim($data['title']));
        }
        
        if (isset($data['content'])) {
            $note->setContent($data['content']);
        }

        // ✅ ENTFERNT: setUpdatedAt (existiert nicht in Note Entity)
        
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
    public function deleteNote(int $id, NoteRepository $noteRepository, EntityManagerInterface $em): JsonResponse 
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $note = $noteRepository->find($id);
        
        if (!$note) {
            return new JsonResponse(['error' => 'Notiz nicht gefunden'], 404);
        }

        if ($note->getProject()->getOwner() !== $this->getUser()) {
            return new JsonResponse(['error' => 'Kein Zugriff auf diese Notiz'], 403);
        }
        
        if (method_exists($note, 'getChildNotes')) {
            $childNotes = $note->getChildNotes();
            if ($childNotes && $childNotes->count() > 0) {
                return new JsonResponse([
                    'error' => 'Diese Notiz kann nicht gelöscht werden, da sie Unter-Notizen enthält.'
                ], 400);
            }
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