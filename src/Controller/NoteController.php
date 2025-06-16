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
     * Notizen laden by PROJECT SLUG (CLEAN VERSION)
     */
    #[Route('/api/notes/project/{slug}', name: 'api_notes_list_by_slug', methods: ['GET'])]
    public function listNotesByProjectSlug(string $slug, NoteRepository $noteRepository, ProjectRepository $projectRepository): JsonResponse
    {
        // Login erforderlich
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        // Projekt über Slug und Owner finden
        $project = $projectRepository->findOneBy([
            'slug' => $slug,
            'owner' => $this->getUser()
        ]);

        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder kein Zugriff'], 404);
        }

        $notes = $noteRepository->findBy(['project' => $project], ['id' => 'DESC']);
        
        return $this->formatNotesResponse($notes);
    }

    /**
     * Notizen laden by PROJECT ID (Legacy Support)
     */
    #[Route('/api/notes/project/{projectId}', name: 'api_notes_list_by_id', methods: ['GET'], requirements: ['projectId' => '\d+'])]
    public function listNotesByProjectId(int $projectId, NoteRepository $noteRepository, ProjectRepository $projectRepository): JsonResponse
    {
        // Login erforderlich
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $project = $projectRepository->findOneBy([
            'id' => $projectId,
            'owner' => $this->getUser()
        ]);

        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder kein Zugriff'], 404);
        }

        $notes = $noteRepository->findBy(['project' => $project], ['id' => 'DESC']);
        
        return $this->formatNotesResponse($notes);
    }

    /**
     * Einzelne Notiz abrufen
     */
    #[Route('/api/notes/{id}', name: 'api_notes_get', methods: ['GET'], requirements: ['id' => '\d+'])]
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
            'updated_at' => method_exists($note, 'getUpdatedAt') && $note->getUpdatedAt() ? $note->getUpdatedAt()->format('Y-m-d H:i:s') : null,
            'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
        ]);
    }
    
    /**
     * Neue Notiz erstellen
     */
    #[Route('/api/notes', name: 'api_notes_create', methods: ['POST'])]
    public function createNote(
        Request $request, 
        EntityManagerInterface $em,
        ProjectRepository $projectRepository
    ): JsonResponse 
    {
        // Login erforderlich
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');

        $data = json_decode($request->getContent(), true);
        
        if (!isset($data['title'])) {
            return new JsonResponse(['error' => 'Titel ist erforderlich'], 400);
        }

        // Projekt finden (Slug bevorzugt, ID als Fallback)
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
        } else {
            return new JsonResponse(['error' => 'Projekt-Slug oder -ID ist erforderlich'], 400);
        }
        
        if (!$project) {
            return new JsonResponse(['error' => 'Projekt nicht gefunden oder kein Zugriff'], 404);
        }
        
        $note = new Note();
        $note->setTitle($data['title']);
        $note->setProject($project);
        $note->setContent($data['content'] ?? ''); // Content optional
        
        // NUR setzen falls die Entity diese Felder hat
        if (method_exists($note, 'setCreatedAt')) {
            $note->setCreatedAt(new \DateTimeImmutable());
        }
        if (method_exists($note, 'setUpdatedAt')) {
            $note->setUpdatedAt(new \DateTimeImmutable());
        }
        
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
            'updated_at' => method_exists($note, 'getUpdatedAt') && $note->getUpdatedAt() ? $note->getUpdatedAt()->format('Y-m-d H:i:s') : null,
            'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
        ]);
    }
    
    /**
     * Notiz aktualisieren
     */
    #[Route('/api/notes/{id}', name: 'api_notes_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
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

        // NUR setzen falls die Entity dieses Feld hat
        if (method_exists($note, 'setUpdatedAt')) {
            $note->setUpdatedAt(new \DateTimeImmutable());
        }
        
        $em->flush();
        
        return new JsonResponse([
            'id' => $note->getId(),
            'title' => $note->getTitle(),
            'content' => $note->getContent(),
            'type' => 'note',
            'updated_at' => method_exists($note, 'getUpdatedAt') && $note->getUpdatedAt() ? $note->getUpdatedAt()->format('Y-m-d H:i:s') : null,
            'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
        ]);
    }

    /**
     * Notiz löschen
     */
    #[Route('/api/notes/{id}', name: 'api_notes_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
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
        
        $em->remove($note);
        $em->flush();
        
        return new JsonResponse(['success' => true, 'message' => 'Notiz gelöscht']);
    }

    /**
     * Helper: Notizen-Response formatieren
     */
    private function formatNotesResponse(array $notes): JsonResponse
    {
        $notesData = array_map(function($note) {
            return [
                'id' => $note->getId(),
                'title' => $note->getTitle(),
                'content' => $note->getContent(),
                'type' => 'note',
                'updated_at' => method_exists($note, 'getUpdatedAt') && $note->getUpdatedAt() ? $note->getUpdatedAt()->format('Y-m-d H:i:s') : null,
                'parentId' => $note->getParentNote() ? $note->getParentNote()->getId() : null
            ];
        }, $notes);
        
        return new JsonResponse($notesData);
    }
}